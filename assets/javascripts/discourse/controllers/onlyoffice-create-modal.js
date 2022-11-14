import Controller from "@ember/controller";
import ModalFunctionality from "discourse/mixins/modal-functionality";
import { schedule } from "@ember/runloop";

export default Controller.extend(ModalFunctionality, {
  onShow() {
    schedule("afterRender", () => {
      // focus on first form field
    });
  },

  onClose() {
    schedule("afterRender", () => {
      const btn = document.querySelector(
        ".d-editor-button-bar .oo-create.btn"
      );
      btn && btn.focus();
    });
  },
});
