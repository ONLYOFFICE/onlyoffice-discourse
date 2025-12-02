<<<<<<< HEAD
import Component from "@ember/component";

export default Component.extend({
    config: null,
    id: "iframeEditor",

    init() {
        this._super(...arguments);
    },

    didInsertElement() {
        this._super(...arguments);
    },

    didRender() {
        this._super(...arguments);

        this.waitForApiJs();
    },

    waitForApiJs() {
        if (window.DocsAPI) {
            this.initEditor();
        } else {
            setTimeout(() => this.waitForApiJs(), 200);
        }
    },

    initEditor() {
        new window.DocsAPI.DocEditor(this.id, JSON.parse(this.config))
    },
});
=======
import Component from "@glimmer/component";
import { action } from "@ember/object";

export default class OnlyofficeEditorFrame extends Component {
  elementId = "iframeEditor";

  @action
  setupEditor(element) {
    this.element = element;
    this.waitForApiJs();
  }

  waitForApiJs() {
    if (window.DocsAPI) {
      this.initEditor();
    } else {
      setTimeout(() => this.waitForApiJs(), 200);
    }
  }

  initEditor() {
    if (!this.args.config) {
      return;
    }

    const config =
      typeof this.args.config === "string"
        ? JSON.parse(this.args.config)
        : this.args.config;

    this.docEditor = new window.DocsAPI.DocEditor(this.elementId, config);
  }
}
>>>>>>> a4aa4ac (feat: add editor frame and routing)
