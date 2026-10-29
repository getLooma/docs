# docs-site Specification

## Purpose
TBD - created by archiving change docs-site. Update Purpose after archive.

## Requirements

### Requirement: The site is a static Astro Starlight build

The repository SHALL build the documentation site with Astro Starlight into static, prerendered
HTML under `dist/` with `pnpm build`, run through `just build`. Every page SHALL be a Markdown
(`.md`) or MDX (`.mdx`) file under `src/content/docs/`, and the build SHALL need no network access
and no secret.

#### Scenario: A clean checkout builds

- **WHEN** `just build` runs in the dev shell on a clean checkout after `pnpm install --frozen-lockfile`
- **THEN** it exits 0 and `dist/index.html` exists

#### Scenario: A page outside the content directory is rejected

- **WHEN** a Markdown page is added under `src/pages/` instead of `src/content/docs/`
- **THEN** `just check` fails and names the file

### Requirement: Pages follow the information architecture

Every page SHALL live under one of the top-level section directories `getting-started/`,
`inbox/`, `issues/`, `ai/`, `integrations/`, `team/`, `privacy/` or `faq/` in
`src/content/docs/`, except the home page `index.mdx`. Integration pages SHALL live one directory
per provider under `integrations/` (for example `integrations/shopify/`). A section SHALL appear in
the sidebar only once it holds at least one page.

#### Scenario: A page in an unknown section fails the check

- **WHEN** a page is added at `src/content/docs/billing/plans.md`
- **THEN** `just check` fails, naming the page and the allowed section directories

#### Scenario: An empty section is not in the sidebar

- **WHEN** the site is built and `src/content/docs/team/` holds no page
- **THEN** no sidebar group for Team and roles is rendered

### Requirement: URLs are stable and readable

Page URLs SHALL be derived from the file path: lowercase, hyphen-separated, with a trailing
slash (`/integrations/shopify/install/`), and SHALL never include a file extension or a date. The
site SHALL be built with `trailingSlash: 'always'` and `build.format: 'directory'`.

#### Scenario: A file path maps to its URL

- **WHEN** `src/content/docs/integrations/shopify/install.md` is built
- **THEN** `dist/integrations/shopify/install/index.html` exists

#### Scenario: An uppercase or underscored file name fails the check

- **WHEN** a page is added at `src/content/docs/inbox/Assign_Conversations.md`
- **THEN** `just check` fails and names the file

### Requirement: Licensing is split between text and code

The repository SHALL contain `LICENSE` (MIT) and `LICENSE-docs` (CC BY 4.0, full legal text).
`README.md` and `CONTRIBUTING.md` SHALL state that everything under `src/content/` and every image
under `src/assets/` is licensed under CC BY 4.0, and that every other file is licensed under MIT.
The site footer SHALL show the CC BY 4.0 notice with a link to the license.

#### Scenario: Both license files exist

- **WHEN** `just check` runs
- **THEN** it fails if `LICENSE` does not contain the MIT license text or `LICENSE-docs` does not
  contain the CC BY 4.0 legal code

#### Scenario: The footer carries the docs license

- **WHEN** any built page is inspected
- **THEN** its footer links to the CC BY 4.0 license

### Requirement: Tooling comes from the dev shell

Every tool the repository uses (Node, pnpm, Prettier, just, Vale, lychee, gitleaks, actionlint)
SHALL come from the Nix dev shell pinned by `flake.lock`; Node packages SHALL be pinned to exact
versions in `package.json` and installed from `pnpm-lock.yaml`. The `justfile` SHALL provide
`dev`, `build`, `fmt`, `fmt-check`, `test`, `routes` and `check`.

#### Scenario: No range versions

- **WHEN** `just check` runs
- **THEN** it fails if any dependency in `package.json` uses a range (`^`, `~`, `*`, `>`, `latest`)

#### Scenario: Staged files are formatted on commit

- **WHEN** a contributor commits a Markdown file that Prettier would change
- **THEN** the pre-commit hook formats it and re-stages it before the commit is recorded
