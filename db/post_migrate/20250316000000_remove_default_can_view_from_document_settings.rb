# frozen_string_literal: true
class RemoveDefaultCanViewFromDocumentSettings < ActiveRecord::Migration[7.0]
  def change
    remove_column :onlyoffice_document_settings, :default_can_view, :boolean
  end
end
