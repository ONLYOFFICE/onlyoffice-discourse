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
end
