import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { action } from "@ember/object";
import { debounce } from "@ember/runloop";
import { ajax } from "discourse/lib/ajax";
import { popupAjaxError } from "discourse/lib/ajax-error";

export default class OnlyofficePermissionsModal extends Component {
  @tracked isLoading = true;
  @tracked selectedUserId = null;
  @tracked canEdit = true;
  @tracked searchTerm = "";
  @tracked searchResults = [];
  @tracked permissions = [];

  constructor() {
    super(...arguments);
    this.loadPermissions();
  }

  get uploadId() {
    return this.args.model.uploadId;
  }

  get uploadShortUrl() {
    return this.args.model.uploadShortUrl;
  }

  get filename() {
    return this.args.model.filename;
  }

  get postId() {
    return this.args.model.postId;
  }

  async loadPermissions() {
    try {
      const url = `/onlyoffice/permissions/${this.uploadShortUrl}${this.postId ? `?post_id=${this.postId}` : ""}`;
      const response = await ajax(url);
      this.permissions = response.permissions || [];
    } catch (error) {
      popupAjaxError(error);
    } finally {
      this.isLoading = false;
    }
  }

  @action
  handleSearchInput(event) {
    const term = event.target.value;
    this.searchTerm = term;
    debounce(this, this.searchUsers, term, 300);
  }

  async searchUsers(term) {
    if (!term || term.length < 2) {
      this.searchResults = [];
      return;
    }

    this.isSearching = true;

    try {
      const response = await ajax("/u/search/users", {
        data: { term, include_staged_users: false },
      });
      this.searchResults = response.users || [];
    } catch (error) {
      popupAjaxError(error);
    } finally {
      this.isSearching = false;
    }
  }

  @action
  selectUser(user) {
    this.selectedUserId = user.id;
    this.searchTerm = user.username;
    this.searchResults = [];
  }

  @action
  toggleCanEdit() {
    this.canEdit = !this.canEdit;
  }

  @action
  async addPermission() {
    if (!this.selectedUserId) {
      return;
    }

    try {
      await ajax(`/onlyoffice/permissions/${this.uploadShortUrl}`, {
        type: "POST",
        data: {
          user_id: this.selectedUserId,
          permission_type: this.canEdit ? "editor" : "viewer",
          post_id: this.postId,
        },
      });

      await this.loadPermissions();
      this.selectedUserId = null;
      this.searchTerm = "";
      this.canEdit = true;
    } catch (error) {
      popupAjaxError(error);
    }
  }

  @action
  async removePermission(permissionId) {
    try {
      const url = `/onlyoffice/permissions/${this.uploadShortUrl}/${permissionId}${this.postId ? `?post_id=${this.postId}` : ""}`;
      await ajax(url, {
        type: "DELETE",
      });

      await this.loadPermissions();
    } catch (error) {
      popupAjaxError(error);
    }
  }

  @action
  togglePermission(permissionId, currentType) {
    const newType = currentType === "editor" ? "viewer" : "editor";
    this.updatePermission(permissionId, newType);
  }

  async updatePermission(permissionId, newType) {
    try {
      await ajax(
        `/onlyoffice/permissions/${this.uploadShortUrl}/${permissionId}`,
        {
          type: "PUT",
          data: {
            permission_type: newType,
            post_id: this.postId,
          },
        },
      );

      await this.loadPermissions();
    } catch (error) {
      popupAjaxError(error);
    }
  }

  @action
  cancel() {
    this.args.closeModal();
  }
}
