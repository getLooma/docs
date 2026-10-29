# CLAUDE.md

Guidance for Claude Code (and any agent) working in this repository.

## This repository is public

getLooma/docs is Looma's **public, open-source user documentation** (docs.getlooma.io). Every
file, commit, branch name, issue, pull request and OpenSpec change here is world-readable.
Looma's code repositories are private. Never write any of the following here, in a page or
anywhere else:

- internal host names, URLs, IP addresses or ports;
- names of private repositories, services, packages, tables, queues or workflows;
- environment variables or configuration that users cannot set;
- infrastructure, vendor or security internals, beyond what a user must do;
- unreleased or planned features, or release dates;
- any real customer, organization, person, email, phone, order or message.

`just check` (`scripts/check-public`) catches some of this mechanically; it is not a licence to
rely on it.

## What it is

- An Astro Starlight site. Pages are Markdown under `src/content/docs/<section>/`. The sections
  and their order are in `src/sections.mjs` (design.md D3 of OpenSpec change `docs-site`): one
  directory per section, lowercase hyphenated file names, a section appears in the sidebar with
  its first page. The home page is `src/content/docs/index.mdx`.
- Every page has a unique `title` (≤ 60) and `description` (50–160), required by
  `src/content.config.ts`. Optional `faq` frontmatter feeds `FAQPage` JSON-LD.
- `STYLE_GUIDE.md` is binding for all user-facing text: answer first, the product vocabulary,
  invented sample data only.
- Docs describe **released** behaviour only.
- A page that moves or disappears needs an entry in `redirects.json`; after adding a page run
  `just routes` (it appends to `published-routes.txt`, never removes).
- Licences: text and images (`src/content/`, `src/assets/`) CC BY 4.0 (`LICENSE-docs`), everything
  else MIT (`LICENSE`), fonts in `src/fonts/` SIL OFL.

## Commands

All tooling comes from the Nix dev shell (`flake.nix`, `flake.lock`); never install tools
globally. Run from the repo root inside the shell (`direnv allow`, or `nix develop -c <cmd>`).

- `just dev` (preview), `just build`, `just fmt`, `just test`, `just routes`, `just serve`
  (the production Caddyfile over `dist/`), `just image` (needs Docker).
- `just check`: everything CI runs (format, workflows, repository files, tests, build with link
  validation, built-site checks, redirects, public-content scan, Vale, Caddy smoke test).
- Owner-only (admin `gh` login): `just ruleset-apply`, `just ruleset-check`,
  `just repo-settings apply|check`.

## Contributions and merging

Anyone may propose; only `@getLooma/dev` merges. `main` is protected by the
ruleset in `.github/rulesets/main.json` (phased, design.md D19). Every commit is signed off
(`git commit -s`, DCO). Pull requests from `drafts/` branches come from the Looma docs bot and
are reviewed and merged by a maintainer like any other; the bot never merges.

## Scope is owned by OpenSpec

Every non-trivial change starts as an OpenSpec change under `openspec/changes/<name>/`
(`proposal.md`, `specs/<capability>/spec.md`, `design.md`, `tasks.md`; schema `spec-driven`,
rules in `openspec/config.yaml`). The `openspec` CLI is on the dev-shell PATH via
`scripts/openspec` (pinned, through `pnpm dlx`). `/opsx:propose` → approval → `/opsx:apply` →
merge → `/opsx:archive`. `openspec validate --strict` passes before a proposal is presented.
Remember: OpenSpec changes here are public too.

## Workflows

- `ci.yml` runs for every pull request, forks included, and must never reference a secret.
- No `pull_request_target` or `workflow_run`, ever; actions are pinned to a full commit SHA.
  `scripts/check-workflows.mjs` enforces both.
- `deploy.yml` deploys `main` only; its Coolify secrets live in the `production` environment.
