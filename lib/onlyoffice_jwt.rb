# frozen_string_literal: true

require 'jwt'

module Onlyoffice
  class OnlyofficeJwt
    def self.enabled?
      SiteSetting.onlyoffice_connector_ds_jwt.present?
    end

    def self.encode(payload)
      return nil unless enabled?
      JWT.encode(payload, SiteSetting.onlyoffice_connector_ds_jwt, 'HS256')
    end

    def self.decode(token)
      return nil unless enabled? || token.blank?
      
      decoded = JWT.decode(token, SiteSetting.onlyoffice_connector_ds_jwt, true, { algorithm: 'HS256' })[0]
      decoded.to_json
    rescue JWT::DecodeError => e
      Rails.logger.error("JWT decode failed: #{e.message}")
      nil
    end

    def self.generate_editor_token(config)
      encode(config)
    end
  end
end
