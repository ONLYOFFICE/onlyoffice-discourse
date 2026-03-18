# frozen_string_literal: true
class CreateOnlyofficeDocumentSettings < ActiveRecord::Migration[7.0]
  def change
    create_table :onlyoffice_document_settings do |t|
      t.integer :upload_id, null: false
      t.boolean :default_can_view, null: false, default: true
      t.boolean :default_can_edit, null: false, default: false
      t.timestamps
    end

    add_index :onlyoffice_document_settings, :upload_id, unique: true
  end
end
