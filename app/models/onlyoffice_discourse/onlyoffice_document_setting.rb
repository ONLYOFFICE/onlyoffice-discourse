# frozen_string_literal: true

module Onlyoffice
  class DocumentSetting < ActiveRecord::Base
    self.table_name = "onlyoffice_document_settings"
    self.ignored_columns = ["default_can_view"]

    belongs_to :upload

    validates :upload_id, presence: true, uniqueness: true
    validates :default_can_edit, inclusion: { in: [true, false] }
  end
end
