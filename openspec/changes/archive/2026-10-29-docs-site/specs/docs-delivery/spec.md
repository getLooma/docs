## ADDED Requirements

### Requirement: just check is the CI gate

`just check` SHALL run, and fail on the first failure of: the Prettier check, `actionlint`, the
dependency pin check, the vitest tests of the check scripts, `just build` (which includes the
frontmatter schema and `starlight-links-validator`), the built-site check
(`scripts/check-site.mjs`), the redirect check (`scripts/check-routes.mjs`), the public-content
scan (`scripts/check-public`), the repository-file checks (licenses, templates, CODEOWNERS) and
Vale. `ci.yml` SHALL run `just check` in the Nix dev shell on every pull request and every push
to `main`.

#### Scenario: CI runs the same gate

- **WHEN** `.github/workflows/ci.yml` is inspected
- **THEN** its `check` job runs `nix develop -c just check` for `pull_request` and for pushes to
  `main`

#### Scenario: A broken internal link fails

- **WHEN** a page links to `/inbox/does-not-exist/`
- **THEN** `just build` fails with `starlight-links-validator` naming the page and the link

### Requirement: Nothing internal reaches the public repository

`scripts/check-public` SHALL scan every tracked file and fail on: secrets (`gitleaks`), private
network addresses and internal host names (RFC 1918 and link-local IPs, `localhost` with a port,
host names ending in `.internal`, `.local` or `.lan`), container registry paths of private images,
links to any `github.com/getLooma/` repository other than `docs`, and, in pages under
`src/content/`, upper-case identifiers that look like environment variables
(`[A-Z][A-Z0-9]*_[A-Z0-9_]*[A-Z0-9]`). Tooling files may name CI variables. A match is accepted
only when it appears verbatim in `scripts/public-allowlist.txt`. Lines may opt out only through that allowlist, which is owned by
the owners in CODEOWNERS.

#### Scenario: An internal address fails

- **WHEN** a page contains `http://10.0.3.7:8080/healthz`
- **THEN** `just check` fails and names the file and line

#### Scenario: An environment variable name fails

- **WHEN** a page mentions `SHOPIFY_CLIENT_SECRET`
- **THEN** `just check` fails, because the name is not in the allowlist

#### Scenario: A link to a private repository fails

- **WHEN** a page links to `https://github.com/getLooma/<any repository but docs>/pull/12`
- **THEN** `just check` fails and names the link

### Requirement: Fork pull requests never see secrets

No workflow SHALL use the `pull_request_target` or `workflow_run` trigger. Every workflow SHALL
declare top-level `permissions` with `contents: read` and only the extra scopes a job needs. The
jobs that run pull request code (`ci.yml`) SHALL reference no secret. `pr-review.yml` SHALL run
only for pull requests whose head repository is this repository, or for a `/review` comment by an
owner, member or collaborator on such a pull request. Third-party actions SHALL be pinned to a
full commit SHA.

#### Scenario: No dangerous trigger

- **WHEN** `just check` runs `scripts/check-workflows.mjs` over `.github/workflows/`
- **THEN** it fails if any workflow uses `pull_request_target` or `workflow_run`, lacks top-level
  `permissions`, pins a third-party action by tag instead of SHA, or references `secrets.` in
  `ci.yml`

#### Scenario: The review skips forks

- **WHEN** `pr-review.yml` is inspected
- **THEN** its job condition requires `github.event.pull_request.head.repo.full_name ==
github.repository` for pull request events

### Requirement: Repository settings are kept as code

`scripts/repo-settings` SHALL apply (`just repo-settings apply`) and verify (`just repo-settings
check`) these repository settings through `gh api`:

- workflow runs from fork pull requests need approval for all external contributors;
- the default `GITHUB_TOKEN` permission is read only, and GitHub Actions may not create or
  approve pull requests;
- actions must be pinned to a full commit SHA;
- squash merge is the only merge method, and head branches are deleted after merge;
- issues and discussions are enabled;
- secret scanning and push protection are on.

The desired values SHALL live in `scripts/repo-settings.json`, and `just check` SHALL validate
them offline, so a change to them is reviewed
like any other file.

#### Scenario: Drifted settings are reported

- **WHEN** `just repo-settings check` runs with an admin token and the default `GITHUB_TOKEN`
  permission on GitHub is `write`
- **THEN** it exits non-zero and names the setting

#### Scenario: Weakened desired values fail the check

- **WHEN** the desired values in `scripts/repo-settings.json` allow merge commits or turn off SHA
  pinning
- **THEN** `just check` fails and names the setting

### Requirement: External links are checked on a schedule

`links.yml` SHALL run `lychee` over the built site weekly and by hand, and SHALL open or update one
issue labelled `broken-links` listing the failures. It SHALL NOT run on pull requests, so a flaky
external site never blocks a merge.

#### Scenario: The link check is scheduled only

- **WHEN** `links.yml` is inspected
- **THEN** its triggers are `schedule` and `workflow_dispatch` only

### Requirement: Only main is deployed, as an immutable image

`deploy.yml` SHALL run only for pushes to `main` and for a manual run, never for a pull request.
It SHALL run `just check`, build the image `ghcr.io/getlooma/docs:<full sha>` (Caddy serving
`dist/`), smoke-test it (pages, `.md` copies, content negotiation, a redirect, `robots.txt`,
`llms.txt`, security headers), push it, move the `live` tag to it, and trigger the Coolify
deployment. The deploy job SHALL run in the GitHub environment `production`, limited to `main`,
which alone holds the Coolify token. A manual run with a `sha` input SHALL move `live` back to
that image and redeploy without rebuilding.

#### Scenario: Pull requests never deploy

- **WHEN** `deploy.yml` is inspected
- **THEN** it has no `pull_request` trigger, and its deploy job has `environment: production`

#### Scenario: The smoke test gates the push

- **WHEN** the image's smoke test fails
- **THEN** nothing is pushed and no deployment is triggered

### Requirement: The server sends safe headers

The production server SHALL send `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`,
`Referrer-Policy: strict-origin-when-cross-origin` and a `Content-Security-Policy` that allows only
the site's own scripts, styles, images and fonts, and SHALL serve `.md` as `text/markdown;
charset=utf-8` and `.txt` as `text/plain; charset=utf-8`. Unknown paths SHALL return the site's
`404` page with status 404.

#### Scenario: Headers are present

- **WHEN** the smoke test requests `/`
- **THEN** each listed header is present

#### Scenario: Unknown paths are 404

- **WHEN** the smoke test requests `/no-such-page/`
- **THEN** the status is 404 and the body is the site's 404 page
