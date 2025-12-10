import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { action } from "@ember/object";
import { service } from "@ember/service";
import { getURLWithCDN } from "discourse/lib/get-url";
import { i18n } from "discourse-i18n";
import OnlyofficeConvertModal from "./onlyoffice-convert-modal";
import OnlyofficePermissionsModal from "./onlyoffice-permissions-modal";

export default class OnlyofficeActionsModal extends Component {
  @service modal;
  @service currentUser;

  @tracked isProcessing = false;

  get filename() {
    return this.args.model.filename;
  }

  get extension() {
    return this.args.model.extension;
  }

  get uploadUrl() {
    return this.args.model.uploadUrl;
  }

  get uploadShortUrl() {
    return this.args.model.uploadShortUrl;
  }

  get uploadId() {
    return this.args.model.uploadId;
  }

  get uploadUserId() {
    return this.args.model.uploadUserId;
  }

  get postUserId() {
    return this.args.model.postUserId;
  }

  get postId() {
    return this.args.model.postId;
  }

  get formatInfo() {
    return this.args.model.formatInfo;
  }

  get isOwner() {
    if (!this.currentUser) {
      return false;
    }

    // Check post author first (handles deduplicated uploads correctly)
    if (this.postUserId !== undefined && this.postUserId !== null) {
      return this.postUserId === this.currentUser.id;
    }

    // Fallback to upload owner
    if (this.uploadUserId !== undefined && this.uploadUserId !== null) {
      return this.uploadUserId === this.currentUser.id;
    }

    return false;
  }

  get documentType() {
    const type = this.formatInfo?.type;
    if (type === "word" || type === "cell" || type === "slide") {
      return type;
    }
    return "pdf";
  }

  get fileIconUrl() {
    return getURLWithCDN(
      `/plugins/onlyoffice-discourse/images/file_${this.documentType}.svg`,
    );
  }

  get availableActions() {
    const formatActions = this.formatInfo?.actions || [];
    const convertFormats = this.formatInfo?.convert || [];
    const actions = [
      {
        id: "download",
        label: i18n("onlyoffice_actions.download"),
        icon: "download",
        class: "btn-default",
      },
    ];

    if (formatActions.includes("view") || formatActions.includes("edit")) {
      actions.push({
        id: "open",
        label: i18n("onlyoffice_actions.open"),
        icon: "file",
        class: "btn-default",
      });

      if (this.isOwner) {
        actions.push({
          id: "permissions",
          label: i18n("onlyoffice_actions.permissions"),
          icon: "users",
          class: "btn-default",
        });
      }
    }
    if (convertFormats.length > 0) {
      actions.push({
        id: "convert",
        label: i18n("onlyoffice_actions.convert"),
        icon: "arrows-rotate",
        class: "btn-default",
      });
    }

    return actions;
  }

  @action
  performAction(actionId) {
    if (this.isProcessing) {
      return;
    }
    this.isProcessing = true;

    const actions = {
      download: () => {
        window.location.href = this.uploadUrl;
        this.args.closeModal();
      },
      open: () => {
        window.open(`/onlyoffice/editor/${this.uploadShortUrl}`, "_blank");
        this.args.closeModal();
      },
      convert: () => {
        this.args.closeModal();
        this.modal.show(OnlyofficeConvertModal, {
          model: {
            filename: this.filename,
            extension: this.extension,
            uploadShortUrl: this.uploadShortUrl,
            availableFormats: this.formatInfo?.convert || [],
          },
        });
      },
      permissions: () => {
        this.args.closeModal();
        this.modal.show(OnlyofficePermissionsModal, {
          model: {
            uploadId: this.uploadId,
            uploadShortUrl: this.uploadShortUrl,
            filename: this.filename,
            postId: this.postId,
          },
        });
      },
    };

    actions[actionId]?.();
  }

  @action
  cancel() {
    this.args.closeModal();
  }
}
