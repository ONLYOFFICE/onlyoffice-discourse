# frozen_string_literal: true

module Jobs
  class CheckDemoExpiration < ::Jobs::Scheduled
    every 1.day

    def execute(args)
      return unless SiteSetting.onlyoffice_connector_enabled

      data = Onlyoffice::OnlyofficeDemo.demo_data

      if data[:enabled] && !data[:available]
        Rails.logger.info("ONLYOFFICE: Demo mode expired, disabling...")
        Onlyoffice::OnlyofficeDemo.enable_demo(false)
        SiteSetting.Connect_to_demo_ONLYOFFICE_Docs_server = false
      end
    end
  end
end
