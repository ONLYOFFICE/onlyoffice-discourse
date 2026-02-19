import Component from "@glimmer/component";
import { i18n } from "discourse-i18n";

export default class OnlyofficeWelcomeBanner extends Component {
  get shouldShow() {
    return window.location.pathname.includes("/admin/plugins/onlyoffice-discourse/settings");
  }

  <template>
    {{#if this.shouldShow}}
      <div class="onlyoffice-uservoice">
        <h3>{{i18n "admin.onlyoffice.welcome.title"}}</h3>
        <p>{{i18n "admin.onlyoffice.welcome.description"}}</p>
        <p>
          <a
            href="https://feedback.onlyoffice.com/forums/966080-your-voice-matters?category_id=519288"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{i18n "admin.onlyoffice.welcome.suggest_feature"}}
          </a>
        </p>
      </div>
    {{/if}}
    {{yield}}
  </template>
}
