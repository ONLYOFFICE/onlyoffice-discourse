import Route from "@ember/routing/route";
import { ajax } from "discourse/lib/ajax";

export default class OnlyofficeEditorRoute extends Route {
  queryParams = {
    view: {
      refreshModel: true,
    },
  };

  async model(params) {
    const viewParam = params.view ? "?view=1" : "";
    const response = await ajax(
      `/onlyoffice/editor/${params.id}.json${viewParam}`,
      {
        type: "GET",
        dataType: "json",
      }
    );

    if (typeof response.doc_config === "string") {
      response.doc_config = JSON.parse(response.doc_config);
    }

    return response;
  }
}
