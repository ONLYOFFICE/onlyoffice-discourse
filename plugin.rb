# frozen_string_literal: true

# name: onlyoffice-discourse
# about: Integration of ONLYOFFICE Document Editor with Discourse
# version: 1.0.0
# authors: ONLYOFFICE
# url: https://github.com/ONLYOFFICE/onlyoffice-discourse
# required_version: 3.2.0

register_asset "stylesheets/onlyoffice.scss"
register_svg_icon "onlyoffice-logo"
enabled_site_setting :onlyoffice_connector_enabled

on(:site_setting_changed) do |name, _old_value, new_value|
    if name == :ONLYOFFICE_connector_auto_authorize_extensions && new_value == true
        Onlyoffice.update_authorized_extensions
    end
end

after_initialize do
    module ::Onlyoffice
        PLUGIN_NAME = "onlyoffice-discourse"
        PLUGIN_ROOT = File.dirname(__FILE__)

        def self.update_authorized_extensions
            formats_file = File.join(PLUGIN_ROOT, "assets", "document_formats", "onlyoffice-docs-formats.json")
            fallback_extensions = %w[docx xlsx pptx pdf doc xls ppt odt ods odp rtf]

            extensions = if File.exist?(formats_file)
                begin
                    JSON.parse(File.read(formats_file)).map { |f| f["name"] }.compact.uniq
                rescue => e
                    Rails.logger.error("Failed to load document formats: #{e.message}")
                    fallback_extensions
                end
            else
                fallback_extensions
            end

            current = SiteSetting.authorized_extensions.split("|").map(&:strip)
            extensions.each { |ext| current << ext if current.exclude?(ext) }
            SiteSetting.authorized_extensions = current.join("|")
        end
    end

    Onlyoffice.update_authorized_extensions if SiteSetting.ONLYOFFICE_connector_auto_authorize_extensions

    require_relative "lib/onlyoffice_discourse/onlyoffice_jwt.rb"
    require_relative "lib/onlyoffice_discourse/onlyoffice_conversion_service.rb"
    require_relative "lib/onlyoffice_discourse/onlyoffice_controller_extensions.rb"
    require_relative "app/models/onlyoffice_discourse/onlyoffice_permission.rb"
    require_relative "app/controllers/onlyoffice_discourse/onlyoffice_controller.rb"

    # Include controller extensions for development mode class reloading
    Onlyoffice::OnlyofficeController.class_eval do
      include Onlyoffice::ControllerExtensions
    end

    class Onlyoffice::Engine < Rails::Engine
        engine_name Onlyoffice::PLUGIN_NAME
        isolate_namespace Onlyoffice
    end

    Onlyoffice::Engine.routes.draw do
        post "create" => "onlyoffice#create"
        post "convert" => "onlyoffice#convert"
        get "editor/*id" => "onlyoffice#editor", constraints: { id: /[^\/]+/ }
        match "callback/*id" => "onlyoffice#callback", constraints: { id: /[^\/]+/ }, via: [:get, :post]
        get "formats" => "onlyoffice#formats"
        get "upload-info/:id" => "onlyoffice#upload_info", constraints: { id: /[^\/]+/ }
        get "permissions/:id" => "onlyoffice#list_permissions", constraints: { id: /[^\/]+/ }
        post "permissions/:id" => "onlyoffice#create_permission", constraints: { id: /[^\/]+/ }
        put "permissions/:id/:permission_id" => "onlyoffice#update_permission", constraints: { id: /[^\/]+/ }
        delete "permissions/:id/:permission_id" => "onlyoffice#delete_permission", constraints: { id: /[^\/]+/ }
    end

    Discourse::Application.routes.append do
        mount ::Onlyoffice::Engine => "/onlyoffice"
    end
end
