import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { action } from "@ember/object";
import { service } from "@ember/service";
import { ajax } from "discourse/lib/ajax";
import { getURLWithCDN } from "discourse/lib/get-url";
import OnlyofficeConvertModal from "./onlyoffice-convert-modal";
import OnlyofficeEditorModal from "./onlyoffice-editor-modal";
import OnlyofficePermissionsModal from "./onlyoffice-permissions-modal";

export default class OnlyofficeActionsModal extends Component {
  @service modal;
  @service currentUser;

  @tracked isProcessing = false;
  @tracked userPermission = null;
  @tracked permissionsLoaded = false;

  constructor() {
    super(...arguments);
    this.loadUserPermission();
  }

  async loadUserPermission() {
    // If no user logged in, default to viewer
    if (!this.currentUser) {
      this.userPermission = "viewer";
      this.permissionsLoaded = true;
      return;
    }

    // Owner or post author always has edit rights
    if (this.isOwner) {
      this.userPermission = "editor";
      this.permissionsLoaded = true;
      return;
    }

    // Check if user is the upload owner (even if not post author)
    if (this.uploadUserId && this.uploadUserId === this.currentUser.id) {
      this.userPermission = "editor";
      this.permissionsLoaded = true;
      return;
    }

    // Load user permission from upload-info endpoint
    try {
      const response = await ajax(
        `/onlyoffice/upload-info/${this.uploadShortUrl}`,
      );

      // eslint-disable-next-line no-console
      console.log("ONLYOFFICE upload-info response:", response);

      this.userPermission = response.user_permission || "viewer";
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("ONLYOFFICE upload-info error:", error);
      // Default to viewer if can't load permissions
      this.userPermission = "viewer";
    } finally {
      this.permissionsLoaded = true;
    }
  }

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

  get canEdit() {
    if (!this.permissionsLoaded) {
      return this.isOwner;
    }
    return this.userPermission === "editor";
  }

  get canView() {
    if (!this.permissionsLoaded) {
      return true;
    }
    return this.userPermission !== "none";
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
    const actions = [];

    // Only show open/edit button if user has view or edit permission
    if (
      this.canView &&
      (formatActions.includes("view") || formatActions.includes("edit"))
    ) {
      const openLabelKey = this.canEdit
        ? "onlyoffice_actions.edit"
        : "onlyoffice_actions.preview";

      actions.push({
        id: "open",
        labelKey: openLabelKey,
        icon: this.canEdit ? "pen-to-square" : "eye",
        class: "btn-default",
      });
    }

    actions.push({
      id: "download",
      labelKey: "onlyoffice_actions.download",
      icon: "download",
      class: "btn-default",
    });

    if (this.isOwner) {
      actions.push({
        id: "permissions",
        labelKey: "onlyoffice_actions.permissions",
        icon: "users",
        class: "btn-default",
      });
    }

    // Only show convert for authorized users
    if (convertFormats.length > 0 && this.currentUser) {
      actions.push({
        id: "convert",
        labelKey: "onlyoffice_actions.convert",
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
        this.args.closeModal();
        this.modal.show(OnlyofficeEditorModal, {
          model: {
            uploadShortUrl: this.uploadShortUrl,
            viewOnly: !this.canEdit,
          },
        });
      },
      convert: () => {
        this.args.closeModal();
        this.modal.show(OnlyofficeConvertModal, {
          model: {
            ...this.args.model,
            availableFormats: this.formatInfo?.convert || [],
          },
        });
      },
      permissions: () => {
        this.args.closeModal();
        this.modal.show(OnlyofficePermissionsModal, {
          model: this.args.model,
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
