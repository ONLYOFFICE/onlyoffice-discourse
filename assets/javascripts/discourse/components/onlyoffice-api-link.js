import Component from "@glimmer/component";
import { action } from "@ember/object";

export default class OnlyofficeApiLink extends Component {
  @action
  loadScript(element) {
    if (this.args.host) {
      const script = document.createElement("script");
      script.src = `${this.args.host}/web-apps/apps/api/documents/api.js`;
      element.appendChild(script);
    }
  }
}
