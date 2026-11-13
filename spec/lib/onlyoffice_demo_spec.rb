# frozen_string_literal: true

# Smoke tests for demo mode and extension auto-authorization (HANDOVER.md, section 2).
RSpec.describe Onlyoffice::OnlyofficeDemo do
  before do
    enable_current_plugin
    SiteSetting.ONLYOFFICE_Docs_address = "https://docs.example.com"
    SiteSetting.JWT_header = "Authorization"
  end

  it "switches to the demo server and restores the admin's settings when turned off" do
    expect(described_class.enable_demo(true)).to eq(true)

    expect(described_class.demo_enabled?).to eq(true)
    expect(SiteSetting.ONLYOFFICE_Docs_address).to eq(described_class::DEMO_ADDR)
    expect(SiteSetting.JWT_header).to eq(described_class::DEMO_HEADER)
    expect(described_class.days_remaining).to eq(described_class::DEMO_TRIAL_DAYS)

    described_class.enable_demo(false)

    expect(described_class.demo_enabled?).to eq(false)
    expect(SiteSetting.ONLYOFFICE_Docs_address).to eq("https://docs.example.com")
    expect(SiteSetting.JWT_header).to eq("Authorization")
  end

  it "cannot be re-enabled after the trial period" do
    freeze_time
    described_class.enable_demo(true)
    described_class.enable_demo(false)

    freeze_time((described_class::DEMO_TRIAL_DAYS + 1).days.from_now)

    expect(described_class.demo_available?).to eq(false)
    expect(described_class.enable_demo(true)).to eq(false)
    expect(SiteSetting.ONLYOFFICE_Docs_address).to eq("https://docs.example.com")
  end

  it "is switched off by the daily job once expired" do
    freeze_time
    described_class.enable_demo(true)

    freeze_time((described_class::DEMO_TRIAL_DAYS + 1).days.from_now)
    Jobs::CheckDemoExpiration.new.execute({})

    expect(described_class.demo_enabled?).to eq(false)
    expect(SiteSetting.Connect_to_demo_ONLYOFFICE_Docs_server).to eq(false)
    expect(SiteSetting.ONLYOFFICE_Docs_address).to eq("https://docs.example.com")
  end
end

RSpec.describe Onlyoffice do
  before { enable_current_plugin }

  describe ".update_authorized_extensions" do
    it "adds ONLYOFFICE formats without dropping existing extensions" do
      SiteSetting.authorized_extensions = "jpg|png"

      described_class.update_authorized_extensions

      extensions = SiteSetting.authorized_extensions.split("|")
      expect(extensions).to include("jpg", "png", "docx", "xlsx", "pptx", "pdf")
    end
  end
end
