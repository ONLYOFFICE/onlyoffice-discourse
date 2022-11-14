require "open-uri"
require "json"

class Onlyoffice::OnlyofficeController < ::ApplicationController

    protect_from_forgery except: :callback

    def editor

        is_view = params[:view]

        file_url = ""

        PrettyText::Helpers.lookup_upload_urls([params[:id]]).each do |short_url, paths|
            file_url << paths[:url]
        end

        render json: {
            config: {
                ds_host: SiteSetting.onlyoffice_connector_ds_host,
            },
            id: params[:id],
            doc_config: {
                type: "desktop",
                documentType: "word",
                document: {
                    title: params[:id],
                    url: SiteSetting.onlyoffice_connector_discourse_host + file_url,
                    fileType: "docx",
                    key: params[:id],
                    permissions: {
                        edit: !is_view
                    }
                },
                editorConfig: {
                    mode: is_view ? "view" : "edit",
                    lang: get_user_locale,
                    callbackUrl: SiteSetting.onlyoffice_connector_discourse_host + "/onlyoffice/callback/#{params[:id]}.json",
                    user: {
                        id: current_user.id,
                        name: current_user.name ? current_user.name : current_user.username,
                    },
                    customization: {
                        forcesave: false,
                    }
                }
            }.to_json
        }
    end

    def callback
        response_json = {
            error: 0,
            message: ""
        }
        
        begin
            callback_body = request.body.read
            if callback_body.empty? || callback_body == nil
                return nil
            end
            
            data = JSON.parse(callback_body)

            if data == nil || data.empty?
                response_json[:message] = "Callback data is null or empty"
                return
            end

            status = data["status"].to_i

            case status
            when 0
                response_json[:message] = "ONLYOFFICE has reported that no doc with the specified key can be found"
            when 1
                response_json[:message] = "User has entered/exited ONLYOFFICE"
            when 2
                response_json[:message] = "Saved"
            when 3
                response_json[:message] = "ONLYOFFICE has reported that saving the document has failed"
            when 4
                response_json[:message] = "No document updates"
            else
                
            end

        rescue => exception
            response_json[:message] = exception.message
            response_json[:error] = 1
        ensure
            render json: response_json, status: response_json[:error] == 1 ? :internal_server_error : :ok
        end
        
    end

    private

    def get_user_locale
        return SiteSetting.allow_user_locale && current_user.locale ? current_user.locale : SiteSetting.default_locale
    end
end