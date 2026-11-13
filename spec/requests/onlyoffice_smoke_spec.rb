# frozen_string_literal: true

# Smoke tests for the main user scenarios (HANDOVER.md, section 2).
# Run inside a Discourse dev checkout:  bin/rspec plugins/onlyoffice-discourse/spec
RSpec.describe "ONLYOFFICE plugin smoke", type: :request do
  fab!(:owner) { Fabricate(:user, trust_level: TrustLevel[1]) }
  fab!(:other) { Fabricate(:user, trust_level: TrustLevel[1]) }

  before do
    enable_current_plugin
    SiteSetting.authorized_extensions = "docx|xlsx|pptx|pdf"
  end

  describe "formats" do
    it "serves the ONLYOFFICE formats list" do
      get "/onlyoffice/formats"

      expect(response.status).to eq(200)
      names = response.parsed_body.map { |f| f["name"] }
      expect(names).to include("docx", "xlsx", "pptx", "pdf")
    end
  end

  describe "creating a file" do
    it "requires login" do
      post "/onlyoffice/create", params: { document_type: "docx" }, xhr: true
      expect(response.status).to eq(403)
    end

    it "rejects unknown document types" do
      sign_in(owner)
      post "/onlyoffice/create", params: { document_type: "exe" }, xhr: true
      expect(response.status).to eq(400)
    end

    %w[docx xlsx pptx pdf].each do |type|
      it "creates a unique #{type} upload from the template" do
        sign_in(owner)

        post "/onlyoffice/create",
             params: {
               document_type: type,
               locale: "ru",
               filename: "report",
             },
             xhr: true
        expect(response.status).to eq(200)
        first = response.parsed_body
        expect(first["original_filename"]).to eq("report.#{type}")
        expect(first["short_url"]).to start_with("upload://")

        # Discourse dedups uploads by SHA1 — every new file must be a separate upload.
        post "/onlyoffice/create", params: { document_type: type, filename: "report" }, xhr: true
        expect(response.status).to eq(200)
        expect(response.parsed_body["id"]).not_to eq(first["id"])
        expect(Upload.find(response.parsed_body["id"]).sha1).not_to eq(
          Upload.find(first["id"]).sha1,
        )
      end
    end
  end

  describe "editor config" do
    fab!(:upload) { office_upload(user: owner) }

    def editor_config
      get "/onlyoffice/editor/#{short_id(upload)}.json"
      expect(response.status).to eq(200)
      response.parsed_body
    end

    it "opens the owner's file in edit mode" do
      sign_in(owner)
      body = editor_config
      doc = body["doc_config"]

      expect(body["config"]["ds_host"]).to eq(SiteSetting.ONLYOFFICE_Docs_address)
      expect(doc["documentType"]).to eq("word")
      expect(doc["document"]["fileType"]).to eq("docx")
      expect(doc["document"]["title"]).to eq("report.docx")
      expect(doc["document"]["key"]).to eq("#{short_id(upload)}_#{upload.updated_at.to_i}")
      expect(doc["editorConfig"]["mode"]).to eq("edit")
      expect(doc["editorConfig"]["callbackUrl"]).to end_with(
        "/onlyoffice/callback/#{short_id(upload)}",
      )
    end

    it "opens someone else's file in view mode by default" do
      sign_in(other)
      expect(editor_config["doc_config"]["editorConfig"]["mode"]).to eq("view")
    end

    it "gives edit mode to a user with an explicit editor permission" do
      Onlyoffice::Permission.create!(
        upload_id: upload.id,
        user_id: other.id,
        permission_type: "editor",
      )
      sign_in(other)
      expect(editor_config["doc_config"]["editorConfig"]["mode"]).to eq("edit")
    end

    it "gives edit mode to everyone when default editing is allowed" do
      Onlyoffice::DocumentSetting.create!(upload_id: upload.id, default_can_edit: true)
      sign_in(other)
      expect(editor_config["doc_config"]["editorConfig"]["mode"]).to eq("edit")
    end

    it "opens the file for anonymous users in view mode" do
      doc = editor_config["doc_config"]
      expect(doc["editorConfig"]["mode"]).to eq("view")
      expect(doc["editorConfig"]["user"]["id"]).to eq("guest")
    end

    it "signs the config when a secret is set" do
      SiteSetting.ONLYOFFICE_Docs_secret_key = OnlyofficeSpecHelpers::TEST_SECRET
      sign_in(owner)
      doc = editor_config["doc_config"]

      payload =
        JWT.decode(doc["token"], OnlyofficeSpecHelpers::TEST_SECRET, true, algorithm: "HS256")[0]
      expect(payload["document"]["key"]).to eq(doc["document"]["key"])
    end
  end

  describe "callback (saving)" do
    fab!(:upload) { office_upload(user: owner) }

    let(:ds_file_url) { "http://ds.example.com/cache/files/output.docx" }
    let!(:path) { put_file_on_disk(upload, "original content") }

    before { SiteSetting.ONLYOFFICE_Docs_secret_key = OnlyofficeSpecHelpers::TEST_SECRET }
    after { FileUtils.rm_f(path) }

    def send_callback(payload)
      post "/onlyoffice/callback/#{short_id(upload)}",
           params: { token: callback_token(payload) }.to_json,
           headers: {
             "CONTENT_TYPE" => "application/json",
           }
    end

    it "answers the GET health check" do
      get "/onlyoffice/callback/#{short_id(upload)}"
      expect(response.parsed_body["error"]).to eq(0)
    end

    it "acknowledges status 1 (user connected)" do
      send_callback(status: 1, key: "k")
      expect(response.status).to eq(200)
      expect(response.parsed_body["error"]).to eq(0)
    end

    it "saves the document in place on status 2" do
      stub_request(:get, ds_file_url).to_return(status: 200, body: "edited content")

      send_callback(status: 2, key: "k", url: ds_file_url)

      expect(response.status).to eq(200)
      expect(response.parsed_body["error"]).to eq(0)
      expect(File.binread(path)).to eq("edited content")
      expect(upload.reload.filesize).to eq("edited content".bytesize)
    end

    it "rejects a request without a token" do
      post "/onlyoffice/callback/#{short_id(upload)}",
           params: { status: 2, url: ds_file_url }.to_json,
           headers: {
             "CONTENT_TYPE" => "application/json",
           }

      expect(response.status).to eq(400)
      expect(File.binread(path)).to eq("original content")
    end

    it "rejects a token signed with another secret" do
      token = JWT.encode({ status: 2, url: ds_file_url }, "wrong-secret", "HS256")
      post "/onlyoffice/callback/#{short_id(upload)}",
           params: { token: token }.to_json,
           headers: {
             "CONTENT_TYPE" => "application/json",
           }

      expect(response.status).to eq(400)
      expect(File.binread(path)).to eq("original content")
    end
  end

  describe "permissions" do
    fab!(:upload) { office_upload(user: owner) }

    it "lets the owner manage per-user permissions and defaults" do
      sign_in(owner)
      base = "/onlyoffice/permissions/#{short_id(upload)}"

      post base, params: { user_id: other.id, permission_type: "editor" }, xhr: true
      expect(response.status).to eq(200)

      get base, xhr: true
      expect(response.status).to eq(200)
      perms = response.parsed_body["permissions"]
      expect(perms.map { |p| [p["user"]["id"], p["permission_type"]] }).to eq(
        [[other.id, "editor"]],
      )
      expect(response.parsed_body["default_can_edit"]).to eq(false)

      permission_id = perms.first["id"]
      put "#{base}/#{permission_id}", params: { permission_type: "viewer" }, xhr: true
      expect(response.status).to eq(200)
      expect(Onlyoffice::Permission.find(permission_id).permission_type).to eq("viewer")

      delete "#{base}/#{permission_id}", xhr: true
      expect(response.status).to eq(200)
      expect(Onlyoffice::Permission.exists?(permission_id)).to eq(false)

      put "/onlyoffice/document-settings/#{short_id(upload)}",
          params: {
            default_can_edit: true,
          },
          xhr: true
      expect(response.status).to eq(200)
      expect(Onlyoffice::DocumentSetting.find_by(upload_id: upload.id).default_can_edit).to eq(true)
    end

    it "forbids other users from managing permissions" do
      sign_in(other)
      get "/onlyoffice/permissions/#{short_id(upload)}", xhr: true
      expect(response.status).to eq(403)
    end

    it "reports the current user's permission in upload-info" do
      Onlyoffice::Permission.create!(
        upload_id: upload.id,
        user_id: other.id,
        permission_type: "editor",
      )
      sign_in(other)

      get "/onlyoffice/upload-info/#{short_id(upload)}", xhr: true

      expect(response.status).to eq(200)
      expect(response.parsed_body["upload_id"]).to eq(upload.id)
      expect(response.parsed_body["user_permission"]).to eq("editor")
    end
  end

  describe "conversion" do
    fab!(:upload) { office_upload(user: owner) }

    let(:convert_endpoint) do
      "#{SiteSetting.ONLYOFFICE_Docs_address_for_internal_requests_from_the_server}/ConvertService.ashx"
    end

    it "requires login" do
      post "/onlyoffice/convert",
           params: {
             upload_short_url: short_id(upload),
             target_format: "pdf",
           }
      expect(response.status).to eq(403)
    end

    it "returns a download URL from the Conversion API" do
      stub_request(:post, convert_endpoint).to_return(
        status: 200,
        body: { endConvert: true, fileUrl: "http://ds.example.com/cache/out.pdf" }.to_json,
      )
      sign_in(other)

      post "/onlyoffice/convert",
           params: {
             upload_short_url: short_id(upload),
             target_format: "pdf",
           },
           xhr: true

      expect(response.status).to eq(200)
      expect(response.parsed_body["download_url"]).to eq("http://ds.example.com/cache/out.pdf")
      expect(response.parsed_body["filename"]).to end_with(".pdf")
    end

    it "is forbidden below the minimum trust level" do
      SiteSetting.ONLYOFFICE_minimum_trust_level = "2"
      sign_in(other)

      post "/onlyoffice/convert",
           params: {
             upload_short_url: short_id(upload),
             target_format: "pdf",
           },
           xhr: true

      expect(response.status).to eq(403)
    end
  end

  describe "demo info" do
    it "reports demo mode as disabled by default" do
      get "/onlyoffice/demo-info"

      expect(response.status).to eq(200)
      expect(response.parsed_body["enabled"]).to eq(false)
      expect(response.parsed_body["available"]).to eq(true)
    end
  end
end
