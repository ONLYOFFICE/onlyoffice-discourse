import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { action } from "@ember/object";
import { service } from "@ember/service";
import { ajax } from "discourse/lib/ajax";
import { popupAjaxError } from "discourse/lib/ajax-error";
import { getURLWithCDN } from "discourse/lib/get-url";
import { i18n } from "discourse-i18n";

export default class OnlyofficeCreateModal extends Component {
  @service currentUser;
  @service siteSettings;

  @tracked selectedType = "docx";
  @tracked filename = "";
  @tracked isCreating = false;

  get documentTypes() {
    return [
      {
        value: "docx",
        label: i18n("onlyoffice_create_form.document_type_docx"),
        type: "word",
      },
      {
        value: "xlsx",
        label: i18n("onlyoffice_create_form.document_type_xlsx"),
        type: "cell",
      },
      {
        value: "pptx",
        label: i18n("onlyoffice_create_form.document_type_pptx"),
        type: "slide",
      },
      {
        value: "pdf",
        label: i18n("onlyoffice_create_form.document_type_pdf"),
        type: "pdf",
      },
    ];
  }

  getIconUrl(type) {
    return getURLWithCDN(
      `/plugins/onlyoffice-discourse/images/file_${type}.svg`
    );
  }

  get userLocale() {
    return this.siteSettings.allow_user_locale && this.currentUser?.locale
      ? this.currentUser.locale
      : this.siteSettings.default_locale || "en";
  }

  @action
  selectType(type) {
    this.selectedType = type;
  }

  @action
  updateFilename(event) {
    this.filename = event.target.value;
  }

  @action
  async create() {
    if (!this.selectedType || this.isCreating) {
      return;
    }

    this.isCreating = true;

    try {
      const response = await ajax("/onlyoffice/create", {
        type: "POST",
        data: {
          document_type: this.selectedType,
          locale: this.userLocale,
          filename: this.filename.trim() || null,
        },
      });

      if (response.id) {
        const markup = `[${response.original_filename}|attachment](${response.short_url}) (${response.human_filesize})`;
        this.args.closeModal();
        this.args.model.insertMarkup(markup);
      }
    } catch (error) {
      popupAjaxError(error);
    } finally {
      this.isCreating = false;
    }
  }

  @action
  cancel() {
    this.args.closeModal();
  }
}
