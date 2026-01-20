import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { action } from "@ember/object";
import { service } from "@ember/service";
import { ajax } from "discourse/lib/ajax";
import { popupAjaxError } from "discourse/lib/ajax-error";

export default class OnlyofficeEditorModal extends Component {
  @service siteSettings;

  @tracked isLoading = true;
  @tracked editorConfig = null;
  @tracked dsHost = null;
  @tracked error = null;

  elementId = "iframeEditor";

  constructor() {
    super(...arguments);
    this.loadEditorConfig();
  }

  willDestroy() {
    super.willDestroy(...arguments);
    if (this.docEditor) {
      try {
        this.docEditor.destroyEditor();
      } catch (e) {
        // Ignore errors during cleanup
      }
    }
  }

async loadEditorConfig() {
    try {
      const uploadShortUrl = this.args.model.uploadShortUrl;
      const viewParam = this.args.model.viewOnly ? "?view=1" : "";
      
      const response = await ajax(
        `/onlyoffice/editor/${uploadShortUrl}.json${viewParam}`,
        {
          type: "GET",
          dataType: "json",
        }
      );

      if (typeof response.doc_config === "string") {
        response.doc_config = JSON.parse(response.doc_config);
      }

      this.editorConfig = response.doc_config;
      this.dsHost = response.config.ds_host;
      this.isLoading = false;

      // Wait for next render cycle to initialize editor
      setTimeout(() => this.initEditor(), 100);
    } catch (error) {
      this.error = error;
      this.isLoading = false;
      popupAjaxError(error);
    }
  }

  @action
  setupEditor(element) {
    this.element = element;
    if (this.editorConfig && !this.isLoading) {
      this.initEditor();
    }
  }

  initEditor() {
    if (!this.element || !this.editorConfig) {
      return;
    }

    if (window.DocsAPI) {
      this.docEditor = new window.DocsAPI.DocEditor(this.elementId, this.editorConfig);
    } else {
      setTimeout(() => this.initEditor(), 200);
    }
  }

  

  @action
  close() {
    this.args.closeModal();
  }
}
