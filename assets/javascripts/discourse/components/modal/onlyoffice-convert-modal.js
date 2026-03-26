import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { action } from "@ember/object";
import { service } from "@ember/service";
import { ajax } from "discourse/lib/ajax";
import { popupAjaxError } from "discourse/lib/ajax-error";

export default class OnlyofficeConvertModal extends Component {
  @service modal;
  @tracked selectedFormat = null;
  @tracked isConverting = false;

  get uploadShortUrl() {
    return this.args.model.uploadShortUrl;
  }

  get availableFormats() {
    return this.args.model.availableFormats || [];
  }

  get formatsList() {
    return this.availableFormats.map((format) => ({
      value: format,
      label: format.toUpperCase(),
    }));
  }

  @action
  selectFormat(format) {
    this.selectedFormat = format;
  }

  @action
  async convert() {
    if (!this.selectedFormat || this.isConverting) {
      return;
    }

    this.isConverting = true;

    try {
      const response = await ajax("/onlyoffice/convert", {
        type: "POST",
        data: {
          upload_short_url: this.uploadShortUrl,
          target_format: this.selectedFormat,
        },
      });

      if (response.download_url) {
        const link = document.createElement("a");
        link.href = response.download_url;
        link.download = response.filename || `converted.${this.selectedFormat}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.args.closeModal();
      }
    } catch (error) {
      popupAjaxError(error);
    } finally {
      this.isConverting = false;
    }
  }

  @action
  back() {
    const modelData = this.args.model;
    this.args.closeModal();
    
    // Re-open the actions modal with all original model data
    const modal = this.modal;
    const OnlyofficeActionsModal = require("discourse/plugins/onlyoffice-discourse/discourse/components/modal/onlyoffice-actions-modal").default;
    
    modal.show(OnlyofficeActionsModal, {
      model: { ...modelData },
    });
  }

  @action
  cancel() {
    this.args.closeModal();
  }
}
