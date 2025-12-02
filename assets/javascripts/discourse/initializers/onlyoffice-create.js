import { withPluginApi } from "discourse/lib/plugin-api";
import OnlyofficeCreateModal from "../components/modal/onlyoffice-create-modal";

export default {
  name: "onlyoffice-create",

  initialize(container) {
    const siteSettings = container.lookup("service:site-settings");

    if (!siteSettings.onlyoffice_connector_enabled) {
      return;
    }

    withPluginApi((api) => {
      api.onToolbarCreate((toolbar) => {
        toolbar.addButton({
          id: "oo-create",
          group: "extras",
          icon: "onlyoffice-logo",
          sendAction: (event) =>
            toolbar.context.send("createOnlyofficeDoc", event),
          title: "onlyoffice_buttons.create",
          className: "oo-create",
        });
      });

      api.modifyClass("component:d-editor", {
        pluginId: "onlyoffice-create",

        actions: {
          createOnlyofficeDoc(toolbarEvent) {
            const modal = container.lookup("service:modal");
            modal.show(OnlyofficeCreateModal, {
              model: {
                insertMarkup: (markup) => {
                  toolbarEvent.addText(markup);
                },
              },
            });
          },
        },
      });
    });
  },
};
