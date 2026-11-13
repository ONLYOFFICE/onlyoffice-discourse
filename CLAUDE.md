# CLAUDE.md

ONLYOFFICE plugin for Discourse: a Rails-engine plugin (Ruby) + Ember/Glimmer frontend. Embeds the ONLYOFFICE Docs editor into Discourse posts.
Detailed context, design decisions and the manual checklist are in `HANDOVER.md`.

## Commands

There is no separate build — Discourse builds and loads both the frontend and Ruby. The plugin must live in `<discourse>/plugins/onlyoffice-discourse`.

```bash
pnpm install && bundle install   # dependencies (pnpm only, npm/yarn are blocked)
pnpm lint                        # all linters: eslint, ember-template-lint, stylelint, prettier, rubocop + stree
pnpm lint:fix                    # autofix
pnpm lint:ruby                   # Ruby only
```

Tests and running — from the Discourse root:

```bash
LOAD_PLUGINS=1 bin/rspec plugins/onlyoffice-discourse/spec   # smoke tests (WebMock, no live DS)
bin/rails s                                                    # backend
bin/ember-cli -u                                               # frontend, second terminal
```

Toolchain: Node 22, pnpm 10.28, Ruby 3.3. Minimum Discourse version — 3.4.0.beta3; development was done on 2025.12.

## Structure

- `plugin.rb` — registration, `/onlyoffice/*` routes, `Onlyoffice.update_authorized_extensions`, setting-change handling.
- `app/controllers/onlyoffice_discourse/onlyoffice_controller.rb` — create, editor (config for DocsAPI), callback (saving).
- `lib/onlyoffice_discourse/` — `controller_extensions` (convert, permissions, upload-info, trust level), `conversion_service`, `jwt`, `demo`.
- `app/models/` — `Onlyoffice::Permission`, `Onlyoffice::DocumentSetting`; `db/migrate`, `db/post_migrate`.
- `app/jobs/scheduled/check_demo_expiration.rb` — daily shutdown of an expired demo.
- `assets/javascripts/discourse/` — initializers (composer button, attachment click interception, demo mode in admin), `components/modal/*` (actions, create, editor, convert, permissions).
- `config/settings.yml`, `config/locales/{client,server}.{en,ru}.yml`.
- `assets/document_formats/`, `assets/document_templates/` — vendored copies of `ONLYOFFICE/document-formats` and `ONLYOFFICE/document-templates`.

## Conventions

- Branches `feat/…`, `fix/…`, `chore/…` off `develop` → PR into `develop` (Gitea, git.onlyoffice.com). `master` is for releases only.
- Commits: Conventional Commits (`feat: …`, `fix: …`, `chore: …`).
- Ruby: syntax_tree (width 100) + rubocop-discourse; JS: `@discourse/lint-configs`, prettier. lefthook runs linters on pre-commit and pre-push.
- New UI strings go into both `en` and `ru` right away.
- Behaviour changes come with a spec in `spec/` and, if needed, a manual checklist item in `HANDOVER.md`.

## Don'ts

- Do not commit secrets (DS JWT keys, passwords, tokens). The public demo server data in `onlyoffice_demo.rb` is the only deliberate exception.
- Do not rename site settings from `config/settings.yml`: values are stored in the DB by name.
- Do not remove template uniquification in `create`: Discourse deduplicates uploads by SHA1.
- Do not change the upload's SHA1 or short URL on save — posts link to them. The document key must change after a save.
- Do not edit existing migrations and do not remove `ignored_columns` from `DocumentSetting`.
- Do not edit `assets/document_formats` and `assets/document_templates` by hand — only copy from upstream.
- After a Discourse upgrade, check the demo mode DOM logic (`initializers/onlyoffice-demo-mode.js`).
