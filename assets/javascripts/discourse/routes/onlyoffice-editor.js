import Route from "@ember/routing/route";
import { service } from "@ember/service";
import { ajax } from "discourse/lib/ajax";
import { popupAjaxError } from "discourse/lib/ajax-error";
import { i18n } from "discourse-i18n";

export default class OnlyofficeEditorRoute extends Route {
  @service toasts;

  queryParams = {
    view: {
      refreshModel: true,
    },
  };

  async model(params) {
    const viewParam = params.view ? "?view=1" : "";

    try {
      const response = await ajax(
        `/onlyoffice/editor/${params.id}.json${viewParam}`,
        {
          type: "GET",
          dataType: "json",
        },
      );

      if (typeof response.doc_config === "string") {
        response.doc_config = JSON.parse(response.doc_config);
      }

      // Show demo mode notification if enabled
      if (response.demo_mode?.enabled) {
        const expirationDate = response.demo_mode.expiration_date;
        const formattedDate = expirationDate
          ? new Date(expirationDate).toLocaleDateString()
          : "";

        const message = i18n("js.onlyoffice_editor.demo_notice", {
          date: formattedDate,
        });

        // Show warning toast notification
        this.toasts.warning({
          data: { message },
          duration: 8000,
        });
      }

      return response;
    } catch (error) {
      // Show error notification
      popupAjaxError(error);

      // Redirect back to previous page
      this.router.transitionTo("discovery.latest");

      throw error;
    }
  }
}
