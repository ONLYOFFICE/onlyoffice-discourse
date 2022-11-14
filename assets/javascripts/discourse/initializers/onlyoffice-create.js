import { withPluginApi } from "discourse/lib/plugin-api";
import showModal from "discourse/lib/show-modal";

export default {
    name: "onlyoffice-create",

    initialize(container) {
        const siteSettings = container.lookup("service:site-settings");

        if (!siteSettings.onlyoffice_connector_enabled) {
            return;
        }

        withPluginApi("0.1", (api) => {
            api.onToolbarCreate((toolbar) => {
                toolbar.addButton({
                    id: "oo-create",
                    group: "extras",
                    icon: "onlyoffice-button-create",
                    sendAction: (event) => toolbar.context.send("createOnlyofficeDoc", event),
                    title: "onlyoffice_buttons.create",
                    className: "oo-create",
                });
            });

            api.modifyClass("component:d-editor", {
                pluginId: "onlyoffice-create",
                actions: {
                    createOnlyofficeDoc(toolbarEvent) {
                        showModal("onlyoffice-create-modal").setProperties({
                            insertMarkup: (markup) => {
                                toolbarEvent.addText(markup);
                            },
                        });
                    },
                },
            });
        });
    },
};
