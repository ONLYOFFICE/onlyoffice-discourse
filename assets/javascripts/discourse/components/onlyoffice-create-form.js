/* global Pikaday:true */
import Component from "@ember/component";
import { getOwner } from "discourse-common/lib/get-owner";

export default Component.extend({

  init() {
    this._super(...arguments);
  },

  didInsertElement() {
    this._super(...arguments);
  },

  isValid() {
    return true;
  },

  actions: {
    create() {
      const markup = "[onlyoffice]";

      if (markup) {
        this._closeModal();
        this.insertMarkup(markup);
      }
    },

    cancel() {
      this._closeModal();
    },
  },

  _closeModal() {
    const composer = getOwner(this).lookup("controller:composer");
    composer.send("closeModal");
  },
});
