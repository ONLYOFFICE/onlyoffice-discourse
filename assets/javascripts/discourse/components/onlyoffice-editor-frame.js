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