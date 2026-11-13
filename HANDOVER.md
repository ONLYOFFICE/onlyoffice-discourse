# Project handover: ONLYOFFICE plugin for Discourse

State as of 2026-11-13, branch `develop` @ `eb0d165`.
This file contains no secrets (passwords, tokens, keys) and must never contain any — only where they are stored.
"Unknown" means the information is neither in the code nor known by the previous developer.

## 1. Integration type

- **Plugin inside the host platform** — a Rails-engine Discourse plugin (`plugin.rb`). Installed into `discourse/plugins/` (in a Docker-based Discourse install — via `app.yml` → `hooks.after_code` → `git clone`). There is no separate service.
- **Interaction with ONLYOFFICE** — only **ONLYOFFICE Docs (Document Server)**:
  - Docs API: the browser loads `<ONLYOFFICE_Docs_address>/web-apps/apps/api/documents/api.js` and creates `DocsAPI.DocEditor` inside a Discourse modal;
  - Callback: Document Server sends `POST /onlyoffice/callback/<short_url>` with a status and a link to the saved file; the plugin downloads the file and overwrites the upload;
  - Conversion API: `POST <internal DS address>/ConvertService.ashx` (synchronous) for "Convert";
  - JWT HS256 on the editor config, the callback and the conversion request — enabled when a secret is set;
  - the public ONLYOFFICE demo server (30 days) — a checkbox in the settings.
- **Discourse versions:**
  - development and testing were done on `2025.12.0-latest` (Discourse checkout `a166899c92`, 2025-12-09);
  - the actual minimum is **3.4.0.beta3**: the frontend uses `import { i18n } from "discourse-i18n"`, which did not exist before;
  - the UserVoice banner uses the `admin-config-area-filtered-site-settings` outlet, introduced in **2025.11.0 / 3.6.0.beta2** (on older versions the banner simply does not show);
  - `required_version: 3.2.0` in `plugin.rb` and `3.2.0+` in `.discourse-compatibility` are **outdated** (see section 6).
- **ONLYOFFICE Docs versions:** minimum unknown. Local test stand — `onlyoffice/documentserver-de:10.0`.
- **Repository:** `git@git.onlyoffice.com:ONLYOFFICE/onlyoffice-discourse.git` (Gitea, PRs are merged there). README and `plugin.rb` point to `github.com/ONLYOFFICE/onlyoffice-discourse`.

## 2. Main features

1. **Creating a file** from the composer: ONLYOFFICE toolbar button → modal (type DOCX/XLSX/PPTX/PDF + name) → `POST /onlyoffice/create` → a file from a template matching the user's locale is inserted into the post as an attachment.
2. **Clicking an attachment** of a supported format in a published post → actions modal: Edit / Preview, Download, Manage Permissions (owner only), Convert (signed-in users only). Clicks on attachments in the composer and preview are not intercepted.
3. **Editing / viewing** in ONLYOFFICE (modal with an iframe), real-time co-editing. Saving goes through the callback; the file is overwritten in place, so the link in the post stays the same.
4. **File permissions:** the owner is always an editor; everyone else is a viewer by default; the owner can enable "Allow editing for all users" and set per-user exceptions (viewer/editor).
5. **Conversion** to another format with download of the result.
6. **Minimum trust level** (`ONLYOFFICE_minimum_trust_level`, 0–4 / staff / admin): below it, clicking a file works as a plain download.
7. **Anonymous users** (with level `0`) can only view files, without comments, review or chat.
8. **Demo mode:** a checkbox connects the public demo server for 30 days; admin settings are saved and restored when it is turned off; the daily job `Jobs::CheckDemoExpiration` disables an expired demo.
9. **Auto-extending Discourse `authorized_extensions`** with all ONLYOFFICE formats (`ONLYOFFICE_connector_auto_authorize_extensions`) — on plugin load and when the setting is enabled.
10. **UserVoice banner** ("Suggest a feature") on the plugin settings page.

UI locales: `en`, `ru` (`config/locales/`). New-file templates — ~45 locales.

## 3. Build and environment

There is no separate build step: Discourse (ember-cli) builds JS/HBS/SCSS at startup, Ruby is loaded from `plugin.rb`. In practice, "build" means lint + running in a Discourse dev environment.

- **Toolchain:** Node 22 (`.nvmrc`), pnpm 10.28.0 (`packageManager`; npm/yarn are blocked via `engines`), Ruby 3.3 (`.ruby-version` = 3.3.0; any 3.3.x works). `CONTRIBUTING.md` is outdated — it says pnpm 9.x.
- **Ruby gems:** `jwt`, `rubyzip`. Neither is declared with `gem` in `plugin.rb` — the plugin relies on gems from the Discourse bundle: `rubyzip` is a direct dependency there, `jwt` only a transitive one (2.10.1). The plugin's `Gemfile` is only for dev tools (rubocop-discourse, syntax_tree).
- **Vendored copies of ONLYOFFICE repositories** (not submodules), copied in commit `cddc654` (2025-12-02); the upstream revision was not recorded:
  - `assets/document_formats/` ← `ONLYOFFICE/document-formats`;
  - `assets/document_templates/` ← `ONLYOFFICE/document-templates`.
  Update by copying from upstream as a whole, together with `AUTHORS.md`/`LICENSE`.
- **No private dependencies** — everything comes from public npm/rubygems.
- **Previous developer's dev stand:** a Discourse checkout in WSL Ubuntu (`~/discourse`, the Docker flavour of the dev environment, `bin/docker/*`), the plugin as a separate clone in `~/discourse/plugins/onlyoffice-discourse`; Document Server as a container in Docker Desktop. Running:
  ```bash
  # in the Discourse root, two terminals
  bin/rails s
  DISCOURSE_DEV_ALLOW_ANON_TO_IMPERSONATE=1 ALLOW_EMBER_CLI_PROXY_BYPASS=1 bin/ember-cli -u
  # admin: bundle exec rake admin:create
  # sign in as any user without a password (dev only): /session/<username>/become
  ```
  Document Server must reach Discourse at `Server_address_for_internal_requests_from_ONLYOFFICE_Docs`, and Discourse must reach DS at `ONLYOFFICE_Docs_address_for_internal_requests_from_the_server`. Both default to `http://localhost` — with Docker they almost always have to be set explicitly.
- **Hooks:** lefthook (`pnpm prepare`): pre-commit — linters on staged files, pre-push — `pnpm lint`.
- **CI** (`.github/workflows/`): `lint.yml`, `licenses.yml` (dependency licenses, project is Apache-2.0), `discourse-plugin.yml` (Discourse reusable workflow: linters + rspec + qunit), `create-tag.yml` (tag on push to master), `release.yml` (Release on tag).
- **Tests:** `spec/` — smoke tests (see "Verification"); there are no frontend tests.

## 4. Publishing

Nothing has been published yet: develop is 60 commits ahead of master, there are no tags. The usual process is merging into master.
Discourse has no marketplace with a review process: plugins are installed by git URL. Step by step — `.claude/skills/release/SKILL.md`.

## 5. Implicit knowledge: why it is done this way and what not to touch

- **Making templates unique** (`OnlyofficeController#create`). Discourse deduplicates uploads by SHA1, so without patching `docProps/core.xml` (DOCX/XLSX/PPTX) or appending a comment to the end of a PDF, every "new document" would be the same upload, and editing one would change all of them. Do not remove.
- **Saving "in place"** (`save_file_to_upload`): the content is overwritten at `Discourse.store.path_for(upload)`, SHA1 and short URL stay the same — that is why the link in the post keeps working. The cost: the record's SHA1 no longer matches the content, and it only works with local storage.
- **Document key** = `short_url + "_" + upload.updated_at.to_i` — it must change after every save, otherwise Document Server opens a cached version.
- **IP host rewriting** in the link from DS (`download_file_from_onlyoffice`): DS in Docker returns a link with its internal IP; if the link starts with an IP, the host is replaced with `ONLYOFFICE_Docs_address_for_internal_requests_from_the_server`.
- **Post author vs upload owner.** Because of deduplication, the same file can be attached to posts by different people. The frontend treats the post author as the "owner", the backend uses the upload owner (plus `post_id` for permission management). Keep both sides in mind when changing permissions.
- **Mixed-case setting names** (`ONLYOFFICE_Docs_address`, `Connect_to_demo_ONLYOFFICE_Docs_server`…) — this is how Discourse shows them as readable labels in the admin UI. **Do not rename:** values are stored in the DB by name, all installations would lose their settings. The exception is `onlyoffice_connector_enabled` (the `enabled_site_setting`).
- **Demo mode:** state and the saved admin settings live in `PluginStore` (`onlyoffice-discourse` / `demo_data`). The 30 days count from the first activation and are never reset. Demo server data (address, header, key) is in `lib/onlyoffice_discourse/onlyoffice_demo.rb` — this is the public ONLYOFFICE demo server; keeping it in code is acceptable (as in other connectors).
- **Demo mode admin UI** (`initializers/onlyoffice-demo-mode.js`) — direct DOM manipulation of the settings page: timers + MutationObserver, a programmatic click on the OK button and `location.reload()`. This is fragile: **check it manually after every Discourse upgrade**.
- **`default_can_view`** was dropped by a post-migration, the model keeps `ignored_columns` — do not remove it until all installations have run the migration. Never edit existing migrations — only add new ones.
- **`ControllerExtensions`** live in `lib/` and are included twice (`include` + `class_eval`) — for class reloading in dev.
- **Attachment click interception** — a global `click` listener in the capture phase on `a.attachment` (`onlyoffice-attachment-handler.js`). The short URL is taken from `data-orig-href`/`href`, the extension is stripped.
- **Full-page route** `/onlyoffice/editor/:id` (route + `templates/onlyoffice-editor.hbs` + `OnlyofficeEditorFrame`) — legacy. Nothing in the UI links to it, the editor opens in a modal; it is reachable only by direct URL. The modal uses the same server endpoint `editor/*id.json` — do not remove it.

## 6. Known issues and tech debt

> Specific bugs, including security-related ones, are handed over separately, not in the repository. Nothing is filed in a tracker.

- The declared compatibility is outdated: `required_version`/`.discourse-compatibility` say 3.2.0+, the actual requirement is ≥ 3.4.0.beta3.
- `jwt` is not declared in `plugin.rb`: if Discourse stops pulling it in transitively, the plugin will fail to load.
- Release CI (`create-tag.yml`, `release.yml`) takes the version from a root `CHANGELOG.md`, which does not exist.
- `lint:hbs` only checks `*.gjs`, while templates are `.hbs` — they are not linted in CI.
- `CONTRIBUTING.md` is outdated (pnpm 9.x).
- Demo mode: fragile DOM logic in the admin UI, some texts are hardcoded in English in JS even though locale keys exist.
- Only `en`/`ru` UI locales.
- No frontend tests (QUnit/system specs); the UI is checked manually with the checklist below.
- The full-page editor route is unused.
- **Branches:** no unfinished ones. `fix/actions` is merged into develop and deleted on the remote (a local copy remains on the previous developer's machine). master has commit `38f8c1d` (GitHub issue templates) that is not in develop — merge master → develop at the next opportunity.

## 7. Plans and commitments

None: there is no roadmap, no commitments to customers or partners, no external deadlines.

## Verification

### Automated smoke tests

`spec/requests/onlyoffice_smoke_spec.rb` and `spec/lib/onlyoffice_demo_spec.rb` cover: the formats list; creating all 4 file types and their uniqueness; the editor config (owner / other user / explicit permission / default edit / anonymous, JWT signature); the callback (health check, status 1, saving on status 2, rejection without a token and with a foreign signature); permissions CRUD and default settings; `upload-info`; conversion (login, Conversion API response, trust level); demo mode (on/off with restore, 30 days, daily job); auto-extending `authorized_extensions`. Requests to Document Server are mocked with WebMock.

Run from the Discourse root:

```bash
LOAD_PLUGINS=1 bin/rspec plugins/onlyoffice-discourse/spec
```

> At handover time the specs have only been checked for syntax and with linters (stree, rubocop); **a full run inside Discourse has not been done yet**. The first run may need minor fixes.

### Manual checklist (what cannot be checked without a live Document Server and a browser)

Setup: Discourse + Document Server, the plugin settings have the address, the secret and both internal addresses; three users — owner (TL1), another user (TL1), admin; a second browser or incognito window for an anonymous user.

1. [ ] Settings → Plugins → ONLYOFFICE: all settings are visible, the "Suggest a feature" banner is shown.
2. [ ] Composer → ONLYOFFICE button → create a DOCX with a name → an attachment link `name.docx` appears in the text. Repeat for XLSX, PPTX, PDF.
3. [ ] Publish the post → click the attachment → actions modal: Edit, Download, Manage Permissions, Convert.
4. [ ] Edit → the editor opens, make a change → close → after ~10 s open again: the change is saved.
5. [ ] Co-editing: the owner and a user with editor permission open the same file — they see each other's cursors and changes.
6. [ ] Another user without permissions: "Preview" in the modal, the editor is view-only.
7. [ ] Manage Permissions: find a user, grant Editor → they get "Edit" and edit mode; remove → view again. Enable "Allow editing for all users" → everyone can edit.
8. [ ] Convert: DOCX → PDF downloads; the "Back" button returns to the actions modal.
9. [ ] Download downloads the original file.
10. [ ] Minimum trust level = 2, TL1 user: clicking the attachment just downloads the file.
11. [ ] Anonymous user (trust level 0, site without mandatory login): view only, no Convert and Manage Permissions buttons.
12. [ ] User locale `ru`: a new document is created from the Russian template, the editor UI is in Russian.
13. [ ] Demo mode: enable the checkbox → the page reloads, address, key and header are locked, the expiry date is shown; opening the editor shows a demo toast; disable → the previous settings are back.
14. [ ] `ONLYOFFICE_connector_auto_authorize_extensions` on → docx/xlsx/pptx/pdf etc. appear in `authorized_extensions`.
15. [ ] After a Discourse upgrade: items 1, 2, 3, 13 are mandatory.
