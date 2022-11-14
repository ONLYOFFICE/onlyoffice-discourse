# frozen_string_literal: true

# name: discourse-onlyoffice-connector
# about: TODO
# version: 0.0.1
# authors: ONLYOFFICE
# url: TODO
# required_version: 2.7.0

register_asset "stylesheets/onlyoffice.scss"
enabled_site_setting :onlyoffice_connector_enabled

after_initialize do
    module ::Onlyoffice
        PLUGIN_NAME = "onlyoffice-connector"
    end
    
    require_relative "app/controllers/onlyoffice_controller.rb"
    
    class Onlyoffice::Engine < Rails::Engine
        engine_name Onlyoffice::PLUGIN_NAME
        isolate_namespace Onlyoffice
    end

    Onlyoffice::Engine.routes.draw do
        get "editor/:id" => "onlyoffice#editor" # ToDo: regex for id
        post "callback/:id" => 'onlyoffice#callback'
    end

    Discourse::Application.routes.append do
        mount ::Onlyoffice::Engine => "/onlyoffice"
    end

    register_asset_filter do |type, request, opts|
        path = (opts[:path] || "")
        case type
        when :css
            path.start_with?("#{Discourse.base_path}/onlyoffice") || path.start_with?("#{Discourse.base_path}/t")
        else
            true
        end
      end
end
