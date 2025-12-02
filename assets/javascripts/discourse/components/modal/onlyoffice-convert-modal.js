import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { action } from "@ember/object";
import { ajax } from "discourse/lib/ajax";
import { popupAjaxError } from "discourse/lib/ajax-error";

export default class OnlyofficeConvertModal extends Component {
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
  cancel() {
    this.args.closeModal();
  }
}
