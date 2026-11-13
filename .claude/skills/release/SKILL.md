---
name: release
description: Release a new version of the ONLYOFFICE plugin for Discourse — version bump, CHANGELOG, merge develop → master, tag and release. Use when asked to "make a release", "ship a version" or "merge into master".
---

# Plugin release

Discourse has no marketplace with a review process: plugins are installed by git URL, so a release = merge into `master` + tag. Nothing has been published yet — the first release follows the same steps.

Never push or merge without explicit confirmation from the user.

## 1. Preparation (branch `develop`)

1. Fetch the latest changes: `git fetch --all --prune`. If `master` has commits that are not in `develop` (`git log --oneline origin/develop..origin/master`), merge `master` → `develop` first.
2. Make sure CI on `develop` is green (Lint, Licenses, Discourse Plugin).
3. Run locally:
   ```bash
   pnpm lint
   # from the Discourse root:
   LOAD_PLUGINS=1 bin/rspec plugins/onlyoffice-discourse/spec
   ```
4. Go through the manual checklist in `HANDOVER.md` ("Verification → Manual checklist") against a live Document Server.

## 2. Version and CHANGELOG (branch `release/vX.Y.Z` off `develop`)

1. Bump the version in `plugin.rb` (`# version: X.Y.Z`).
2. If needed, update `.discourse-compatibility` and `# required_version:` in `plugin.rb`: the actual minimum is currently 3.4.0.beta3.
3. Update the root `CHANGELOG.md` (create it for the first release). CI takes the version from the **first** `X.Y.Z`-like number in the file and the release notes from the first `## X.Y.Z` section, so the new section always goes on top:
   ```markdown
   # Change Log

   ## 1.0.0
   - ...
   ```
4. Commit `chore: release vX.Y.Z`, PR into `develop`; after merging — PR `develop` → `master` in Gitea.

## 3. Merge and tag

1. After the merge into `master`, the `create-tag.yml` workflow creates the `vX.Y.Z` tag (skipped if the commit only touches `.github/**`, `README.md`, `LICENSE`, `AUTHORS.md`).
2. The tag triggers `release.yml` → a Release with notes from CHANGELOG.
3. Check that the tag and the Release exist and the version matches `plugin.rb`. If CI did not run — create the tag manually (`git tag -a vX.Y.Z -m "Release/vX.Y.Z"`) only after the user confirms.

## 4. After the release

1. Merge `master` → `develop` so the branches do not diverge.
2. Install the plugin from `master` on a clean Discourse (by git URL) and go through items 1–4 of the manual checklist.
