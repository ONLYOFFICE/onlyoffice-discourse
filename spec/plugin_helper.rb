# frozen_string_literal: true

module OnlyofficeSpecHelpers
  TEST_SECRET = "smoke-test-secret"

  # The client sends the base62 SHA1 without the "upload://" prefix and without extension.
  def short_id(upload)
    Upload.base62_sha1(upload.sha1)
  end

  def office_upload(user:, extension: "docx")
    Fabricate(:upload, user: user, original_filename: "report.#{extension}", extension: extension)
  end

  # Fabricated uploads have no file on disk; callback saving writes to the store path.
  def put_file_on_disk(upload, content)
    path = Discourse.store.path_for(upload)
    FileUtils.mkdir_p(File.dirname(path))
    File.binwrite(path, content)
    path
  end

  def callback_token(payload)
    JWT.encode(payload, TEST_SECRET, "HS256")
  end
end

RSpec.configure { |config| config.include OnlyofficeSpecHelpers }
