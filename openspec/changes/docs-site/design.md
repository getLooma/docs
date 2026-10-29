## Context

- **Repository state:** `main` holds a one-line `README.md`. This branch adds the minimal
  scaffolding `openspec` needs (`flake.nix` with Node, pnpm, Prettier and just; `flake.lock`;
  `.envrc`; `.gitignore`; `.prettierrc`; `scripts/openspec`; `openspec/config.yaml`).
- **Public repository:** everything here, including this change, is readable by anyone. The
  product's code repositories are private. This document names no internal host, private
  repository detail, environment variable, unreleased feature or customer.
- **Conventions mirrored from Looma's other repositories:** the Nix flake dev shell (no global
  installs), `just` recipes with `just check` as the CI gate, Prettier configured once at the root,
  a Husky + lint-staged pre-commit hook, OpenSpec with schema `spec-driven` run through the pinned
  `scripts/openspec` (`pnpm dlx`), `CLAUDE.md` plus `.claude/settings.json`, and production as an
  image built in CI and run by a Coolify Docker Image application.
- **Differences, on purpose:**
  - This is a Node project, so `package.json` sits at the root. The other repositories keep Node
    out of the root because they are Go services.
  - CI runs on GitHub-hosted runners, not Blacksmith. Pull requests from forks run code from
    strangers. GitHub-hosted runners are free for public repositories and isolated per job.
  - The image is built from a small `Dockerfile`, not Railpack. The other repositories avoid
    Dockerfiles because Railpack builds their Go service. Here the image is Caddy plus static
    files, and the server configuration is the point (D13). This is flagged for the owner.
- **Facts checked on 2026-10-29** (npm registry, plugin sources):
  - Starlight bundles Pagefind search and `@astrojs/sitemap`, which is enabled when `site` is set.
  - `starlight-llms-txt` (by a Starlight maintainer) generates `llms.txt`, `llms-full.txt` and
    `llms-small.txt`. Its `customSets` option makes extra bundles, which gives one per section.
  - `starlight-page-actions` adds "Copy Markdown" and "Open in ChatGPT / Claude / …" buttons and
    writes a `<slug>.md` file for every page. It also writes `llms.txt` when `baseUrl` is set.
  - `starlight-dot-md` also serves `.md` copies. It is kept as the fallback.
  - `astro-og-canvas` (same maintainer as `starlight-llms-txt`) renders Open Graph PNGs at build
    time with canvaskit-wasm, with no native dependencies.
  - `starlight-links-validator` validates internal links and anchors during the build.
  - nixpkgs has `vale` 3.17.1, `lychee` 0.24.2 and `gitleaks` 8.30.1.

## Goals / Non-Goals

**Goals:**

- A site outsiders can edit with nothing but a browser, and run locally with one command.
- Every page readable by AI assistants: Markdown copies, `llms.txt`, content negotiation and
  open crawling.
- Strong search basics: unique metadata, canonical URLs, sitemap, structured data, fast pages and
  permanent redirects.
- Checks that make the rules mechanical, so review is about content.
- No path by which a fork pull request, a drafted pull request or a slip of a contributor puts a
  secret or an internal detail on the public site.

**Non-Goals:** see proposal.md. In particular, no documentation pages are written here.

## Decisions

### D1. Framework and pinned versions

Astro Starlight, static output. Each version is the newest release that was at least 14 days old
on 2026-10-29, so a compromised release has had time to be noticed. Exact versions go in
`package.json` (no ranges, checked by `just check`); Dependabot proposes bumps weekly.

| Package                     | Version  | Released   | Role                                                |
| --------------------------- | -------- | ---------- | --------------------------------------------------- |
| `astro`                     | 7.3.8    | 2026-10-08 | site builder                                        |
| `@astrojs/starlight`        | 0.42.6   | 2026-10-08 | docs theme, Pagefind search, sitemap                |
| `starlight-llms-txt`        | 0.12.0   | 2026-09-15 | `llms.txt`, `llms-full.txt`, section bundles        |
| `starlight-page-actions`    | 0.7.1    | 2026-08-18 | `.md` copies, copy and "open in" buttons            |
| `starlight-links-validator` | 0.27.0   | 2026-10-09 | internal link and anchor validation                 |
| `astro-og-canvas`           | 0.13.2   | 2026-09-15 | per-page Open Graph images                          |
| `node-html-parser`          | 9.0.4    | 2026-09-07 | HTML parsing in `scripts/check-site.mjs`            |
| `yaml`                      | 2.9.1    | 2026-09-11 | frontmatter in the config and check scripts         |
| `canvaskit-wasm`            | 0.42.0   | 2026-08-18 | `astro-og-canvas`'s renderer (pnpm needs it direct) |
| `vitest`                    | 5.0.4    | 2026-10-12 | tests for the check scripts                         |
| `prettier`                  | 3.9.10   | 2026-10-10 | formatter (also in the Nix shell for openspec)      |
| `prettier-plugin-astro`     | 1.1.1    | 2026-10-09 | formats `.astro` files                              |
| `husky`                     | 9.1.7    | 2024-11-18 | git hooks                                           |
| `lint-staged`               | 17.6.0   | 2026-09-26 | pre-commit formatting                               |
| Caddy image                 | `2.11.7` | 2026-10    | production server, pinned by digest                 |
| Node (Nix, image build)     | 22       | nixpkgs    | build runtime                                       |

The peer ranges agree: Starlight 0.42.6 needs `astro ^7.2.10`, `starlight-links-validator`
`astro >=7.2.10` and Starlight `>=0.42.0`, and `starlight-llms-txt` `@astrojs/starlight >=0.41.0`.
`starlight-page-actions` declares `>=0.36.0`. Apply re-checks the peers with `pnpm install` and
moves the whole table forward together if any release turns out to be bad.

**Plugin roles do not overlap.** `starlight-page-actions` is configured without `baseUrl`, so it
does not write `llms.txt`, and `starlight-llms-txt` owns every `llms*.txt` file. If the `.md`
copies it writes do not meet the docs-discoverability requirement (title as `h1`, description, no
frontmatter, no imports), apply first tries `starlight-dot-md` 0.2.1, then a 40-line endpoint
`src/pages/[...slug].md.ts` over `getCollection('docs')`. The buttons stay either way. The same
goes for `llms.txt`: if the plugin's index does not list every page with its description,
`src/pages/llms.txt.ts` writes it from the collection and the plugin keeps only the full, small
and section files.

### D2. Repository layout

```
.github/
  workflows/ci.yml  deploy.yml  links.yml  pr-review.yml
  ISSUE_TEMPLATE/docs-error.yml  missing-page.yml  product-question.yml  config.yml
  rulesets/main.json
  PULL_REQUEST_TEMPLATE.md  CODEOWNERS  dependabot.yml
.claude/settings.json   .claude/skills/openspec-*   .claude/commands/opsx/   (openspec init)
.husky/pre-commit       .lintstagedrc.json
deploy/Caddyfile        Dockerfile               .dockerignore
openspec/               scripts/  (openspec, check-site.mjs, check-routes.mjs, check-public,
                                   check-workflows.mjs, check-repo.mjs, routes.mjs, smoke,
                                   budget.json, public-allowlist.txt, *.test.mjs)
src/
  content/docs/index.mdx          (home page; sections arrive with their first page)
  content.config.ts               (docs schema: required description, faq field)
  components/overrides/Head.astro (JSON-LD, alternate Markdown link)
  components/overrides/Footer.astro (CC BY 4.0 notice)
  pages/robots.txt.ts   pages/og/[...slug].png.ts
  assets/               styles/
styles/Looma/           (Vale style)   .vale.ini
astro.config.mjs  package.json  pnpm-lock.yaml  tsconfig.json
published-routes.txt  redirects.json
flake.nix  flake.lock  justfile  .envrc  .editorconfig  .prettierrc  .prettierignore
README.md  CONTRIBUTING.md  STYLE_GUIDE.md  CLAUDE.md  SECURITY.md  CODE_OF_CONDUCT.md
LICENSE  LICENSE-docs
```

### D3. Information architecture and URLs

One directory per section under `src/content/docs/`; the sidebar uses Starlight's `autogenerate`
per directory, and a section's entry is added to `astro.config.mjs` with its first page. The page
lists below are the planned outline. Pages are written by later changes, each only once its
feature is released.

| Section                   | Prefix              | Planned pages                                                                                                                                                                                                               |
| ------------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Getting started           | `/getting-started/` | What Looma is; create your organization; connect your first integration; invite your team; a tour of the app                                                                                                                |
| Inbox and conversations   | `/inbox/`           | The inbox; a conversation and its messages; customers and their history (orders); customer risk                                                                                                                             |
| Issues                    | `/issues/`          | What an issue is (kind, severity, status); the issues list; occurrences; regressed issues                                                                                                                                   |
| AI replies and analysis   | `/ai/`              | Conversation analysis (sentiment, urgency, frustration, churn risk); correcting an analysis; suggested replies and the composer; feedback on a reply; how Looma's AI uses your data                                         |
| Integrations              | `/integrations/`    | Overview; `shopify/` (install from the Shopify App Store, the embedded app, order history, privacy requests from Shopify, uninstall). Discord, HubSpot, Gorgias and Slack each get a directory when they ship, never before |
| Team and roles            | `/team/`            | Invite people; roles and what each can do; organization settings                                                                                                                                                            |
| Privacy and data requests | `/privacy/`         | What data Looma stores; handling a customer's access or erasure request; redaction; retention; subprocessors                                                                                                                |
| FAQ                       | `/faq/`             | One page of short answers (with `faq` frontmatter, D8) plus a glossary of the product vocabulary                                                                                                                            |

URLs: lowercase, hyphenated, derived from the path, `trailingSlash: 'always'`,
`build.format: 'directory'`. Section and integration names in URLs are nouns that do not change
with the UI's wording. The path check (`scripts/check-repo.mjs`) enforces the allowed top-level
directories and the file-name pattern `^[a-z0-9]+(-[a-z0-9]+)*\.mdx?$`.

### D4. Licensing

- `LICENSE`: MIT, copyright "Looma contributors". It covers the site code, configuration,
  scripts, workflows and the Vale style.
- `LICENSE-docs`: the CC BY 4.0 legal code, verbatim. It covers `src/content/**` and
  `src/assets/**` (the text and images of the docs).
- The README "License" section and the CONTRIBUTING "Licensing" section carry the same two-line
  statement. The footer override shows "Text licensed under CC BY 4.0" with a link. Attribution
  is "Looma docs contributors" with a link to the page.
- Logos and trademarks (Looma's, Shopify's and other providers') are excluded from both licenses,
  as `README.md` says. Provider logos are used only as their brand guidelines allow.

### D5. Contribution model (CONTRIBUTING.md plan)

CONTRIBUTING.md sections:

1. **Ways to help:** fix a typo with "Edit this page"; report a wrong or missing page with an
   issue form; propose a new page by opening an issue first, because pages only describe released
   behaviour and a maintainer confirms the scope.
2. **Making a change:** fork, branch, edit Markdown, preview with `just dev` (or
   `pnpm install && pnpm dev` without Nix), run `just check`, open a pull request with the
   template.
3. **What reviewers look for:** accuracy against the product, the style guide, the checklist,
   screenshots with invented data only.
4. **Who reviews and merges:** said plainly at the top of the section: anyone can propose a
   change; a member of the Looma team (`@getLooma/docs-maintainers`) reviews and merges it.
   Outside contributors have read access, so they work from a fork.
   **Review rules:**
   - Every change is a pull request; nobody pushes to `main`.
   - A team member reviews; from phase 3 (D19) the ruleset requires that approval.
   - `ci.yml` green (required from phase 2).
   - Review threads resolved; squash merge only.
   - Maintainers answer within five working days.
   - A pull request inactive for 30 days after a review request is closed with thanks, and can be
     reopened.
   - Product behaviour is confirmed by the team, not by the contributor.
   - Drafted pull requests (D18) follow the same rules.
5. **Sign-off:** DCO 1.1 via `git commit -s`, checked by the `dco` job.
6. **Licensing:** D4's statement. Contributions are accepted under those licenses
   ("inbound = outbound").
7. **Security:** never in an issue; see `SECURITY.md`.
8. **Code of conduct:** Contributor Covenant 2.1.

**Open for the owner, CLA or DCO:** this design recommends the DCO. It is lightweight, standard
for docs projects, needs no signing service, and matches inbound = outbound licensing. A CLA
only matters if Looma may want to relicense contributed text later, or wants an explicit patent
and ownership grant. For CC BY text that is rarely worth the friction for outside contributors.
If the owner picks a CLA, the `dco` job is replaced by a CLA assistant (a GitHub App) and the
requirement is changed before apply.

### D6. Style guide (STYLE_GUIDE.md plan)

- **Audience and goal:** support agents and admins at Looma customers. The reader wants to finish
  a task, not to learn the system.
- **Answer first:** the first paragraph answers the question in the title in at most two
  sentences, then gives the details. This also makes summaries and AI citations accurate.
- **Page types:** task (numbered steps, one action per step, the outcome stated), concept (what it
  is, why it matters, how it relates), reference (tables), troubleshooting (symptom → cause → fix).
  Each has a skeleton in the guide.
- **Voice:**
  - Second person, present tense, active voice, plain words.
  - Short sentences, at most about 25 words.
  - No "simply", "just" or "easy".
  - No future promises ("coming soon").
- **Formatting:**
  - Sentence-case headings, no `h1` in the body.
  - UI labels in bold, exactly as shown.
  - Keys as `<kbd>`.
  - A code block always names its language.
  - Tables for comparisons.
  - Asides (`:::note`, `:::caution`) used sparingly.
- **Vocabulary:** organization, integration, customer, conversation, message, conversation
  analysis, issue (kind, severity, status), suggested reply. Banned synonyms (ticket cluster,
  workspace, tenant, contact, chat) are enforced by Vale.
- **Frontmatter:** `title` (at most 60 characters, unique, no "Looma" suffix, which the site adds),
  `description` (50–160 characters, unique, a complete sentence that answers the page's
  question).
- **Images:**
  - PNG or WebP under `src/assets/<section>/`.
  - Alt text says what the image shows; decorative images use `alt=""` and set `decorative`.
  - Screenshots use invented sample data only: never a real customer, organization, email, order
    or message.
  - Crop to the relevant part.
- **Links:** descriptive text, relative links between pages, never "click here".
- **Never in public docs:** internal host names or URLs, private repository names, issue or pull
  request links, environment variables or configuration that users cannot set, infrastructure or
  vendor internals, security mechanisms beyond what a user must do, unreleased features or dates,
  customer data.

### D7. AI readability

- **`llms.txt`:** `starlight-llms-txt` with `projectName: 'Looma'`, a `description`, and
  `customSets` with one set per section that has pages (`/_llms-txt/<section>.txt`).
  `llms-small.txt` drops asides and code by default. Each entry's summary is the page
  `description`, which the schema makes reliable.
- **`.md` copies:** `starlight-page-actions` (D1) for `/<path>.md` and the buttons ("Copy page as
  Markdown", "Open in ChatGPT", "Open in Claude"; the others are disabled). `Head.astro` adds
  `<link rel="alternate" type="text/markdown" href="/<path>.md">`.
- **Content negotiation:** Caddy (D13) rewrites a page request whose `Accept` contains
  `text/markdown` to its `.md` file and adds `Vary: Accept` on every page. This needs a server we
  control, which is one reason for D13. On the static-host fallback it is dropped. The `.md` URLs
  and the alternate link still work there.
- **Semantic HTML:** Starlight renders the title as the only `h1`, real lists and tables, and
  Expressive Code blocks with `data-language`. `check-site.mjs` asserts these on the build output.
  `check-repo.mjs` rejects `client:` directives and unlabelled fences in sources. Tabs and asides
  render their full content in the HTML.
- **`robots.txt`:** an endpoint `src/pages/robots.txt.ts`, so the sitemap URL comes from `site`.
  It has `User-agent: *` / `Allow: /`, explicit `Allow: /` groups for the AI and search crawlers
  in the docs-discoverability spec, `Sitemap:`, and a comment line pointing to `/llms.txt`. The
  owner decided to allow AI crawlers so the docs get cited.

### D8. SEO

- **Static and light:** every route is prerendered. The only client JS is Starlight's (theme,
  search on demand, the page-actions buttons). `scripts/budget.json` records each page's script
  bytes from the first build plus 20 percent, and `check-site.mjs` fails above it. Lighthouse CI
  is a follow-up: `@lhci/cli` has had no release since 2025-06 and needs Chrome, which the dev
  shell does not carry on macOS.
- **Canonical and trailing slash:** `site: 'https://docs.getlooma.io'`, `trailingSlash:
'always'`. Starlight emits `<link rel="canonical">` from `site`. Caddy redirects `/path` to
  `/path/` with a `301` (its `file_server` default for directories).
- **Metadata schema:** `src/content.config.ts` uses `docsSchema({ extend })` to require
  `description` (50–160 characters), cap `title` at 60, and add an optional `faq` list of
  `{ question, answer }`. Apply confirms that `extend` overrides Starlight's optional
  `description`. If it does not, `check-site.mjs` enforces presence and length on the build
  output instead. Uniqueness is always checked there, because a schema sees one page at a time.
- **Social:** Starlight emits `og:title`, `og:description`, `og:url`, `og:type`, `og:site_name`,
  `og:locale` and `twitter:card`. `Head.astro` adds `og:image`, pointing to
  `/og/<path>.png`, rendered by an `astro-og-canvas` endpoint (title, description, Looma logo,
  1200×630). If the endpoint slows the build beyond 60 s for 100 pages, apply falls back to one
  static default image and records it.
- **Sitemap:** Starlight's built-in integration produces `sitemap-index.xml`. Redirect sources
  are not pages, so they are absent.
- **Structured data (`Head.astro`):** `Organization` and a `BreadcrumbList` from the URL segments
  and section labels on every page. `TechArticle` (headline, description, `dateModified` from git
  through Starlight's `lastUpdated`) on content pages. `FAQPage` from the `faq` frontmatter.
  Google no longer shows FAQ and HowTo rich results for most sites, but the markup is valid and
  cheap, and other search engines and AI systems read it. `HowTo` is not emitted.
- **Language and i18n:** `defaultLocale: 'root'`, `locales: { root: { label: 'English', lang:
'en' } }`. This gives `lang="en"` and unprefixed URLs. A locale such as French can be added
  later as `/fr/…` without moving English URLs.
- **Redirects:** `redirects.json` (`{ "from": "/old/", "to": "/new/" }[]`) is the single source.
  `astro.config.mjs` reads it into Astro's `redirects`, which makes meta-refresh pages for
  `just dev` and the static fallback. `scripts/routes.mjs` renders it into
  `dist/_redirects.caddy`, which the Caddyfile imports as `redir … permanent`, a real `301`.
  `published-routes.txt` is the append-only list of every route ever published. `just routes`
  appends new pages. `check-routes.mjs` enforces the rules in the spec, which catches a deleted or
  renamed page without a redirect.
- **Search Console:** after the first deploy the owner verifies docs.getlooma.io in Google Search
  Console and Bing Webmaster Tools with a DNS TXT record (no verification file in the
  repository), and submits `https://docs.getlooma.io/sitemap-index.xml`.

### D9. The checks in `just check`

```
check: fmt-check
    actionlint .github/workflows/*.yml
    node scripts/check-workflows.mjs
    node scripts/check-repo.mjs          # pins, paths, licenses, templates, CODEOWNERS, sources
    pnpm vitest run                       # tests of every check script, with fixtures
    just build                            # schema + starlight-links-validator
    node scripts/check-site.mjs dist      # HTML, metadata, JSON-LD, .md, llms.txt, sitemap, robots, budget
    node scripts/check-routes.mjs dist
    scripts/check-public                  # gitleaks + patterns
    vale src/content
```

Each script prints file and line, and exits non-zero on the first category with failures, after
reporting all failures in that category. The vitest suite runs each script against small fixture
trees that pass and fail, so a check that silently stops checking fails `just check`.

### D10. Search

Pagefind, built into Starlight. It builds a static index at build time, loads it on demand, and
needs no service or key. Algolia DocSearch is not used: it is an external crawler and service
for no gain at this size.

### D11. Link checking

Internal links and anchors: `starlight-links-validator` during `just build` (blocking). External
links: `links.yml` runs `lychee` from the Nix shell over `dist/` weekly and on demand. It opens
or updates one `broken-links` issue with `GITHUB_TOKEN` (`issues: write`). It never runs on pull
requests.

### D12. Prose lint (Vale, kept small)

`vale` from nixpkgs with a vendored style `styles/Looma/`: `Terms.yml` (substitutions for banned
synonyms), `Headings.yml` (sentence case), `Weasel.yml` ("simply", "just", "easy"). Only `error`
level fails `just check`. No downloaded packages (`vale sync` is never needed), so the check
needs no network. More rules can be added later without changing CI.

### D13. Hosting: our own small image on Coolify (recommended)

**Recommendation (approved by the owner, with the Dockerfile exception):**
`ghcr.io/getlooma/docs`, a one-stage `Dockerfile`: `caddy:2.11.7-alpine`, pinned by digest, with
`deploy/Caddyfile` and the `dist/` that CI built with `just build` and
`node scripts/routes.mjs --caddy dist` in the Nix shell, running as an unprivileged user. A
Coolify Docker Image application runs it at docs.getlooma.io on port 8080.

_Implementation note:_ the design first had a Node build stage in the Dockerfile. Building in
the Nix shell instead keeps one toolchain, and keeps git history for Starlight's `lastUpdated`
(a Docker build context has no `.git`). The image is a packaging step only. Caddy 2.11.7 is also
in the dev shell, so `just check` runs `scripts/smoke --local` against the real Caddyfile without
Docker. CI smoke-tests the image itself. Why this host:

- **Content negotiation** on `Accept: text/markdown`, which the owner asked for, takes a few lines
  of Caddyfile. A pure static host cannot do it, or needs a vendor's edge-function product.
- **Real `301` redirects** from `redirects.json`, custom headers (CSP, HSTS, MIME types for `.md`
  and `.txt`) and a real 404 status.
- **Room for a small runtime later** without changing host.
- **Consistency** with how every other Looma service is deployed: CI builds, Coolify only runs.

**Caddyfile outline:**

- `root * /srv`
- `encode zstd gzip`
- `@md` matches `header Accept *text/markdown*` plus `path_regexp` on a trailing-slash path, then
  `rewrite @md {re.1}.md` (`/` → `/index.md`)
- `header Vary Accept`
- `header /*.md Content-Type "text/markdown; charset=utf-8"`
- `import /srv/_redirects.caddy`
- the security headers
- `handle_errors 404 { rewrite * /404.html; file_server }`
- long cache headers for `/_astro/*` (hashed); short ones for HTML and `.md`

**Deploy without a dangerous secret in a public repository.** A Coolify API token is scoped to a
Coolify team, not to one application, and a public repository's workflows are only as safe as
their review. So:

- The token has only the `read` and `deploy` abilities: no `write`, no `read:sensitive`, no
  `root`. It can trigger a deployment and read its status. It cannot change any application,
  read any secret or create anything. The worst a leak can do is redeploy applications as they
  already are.
- Without `write`, CI cannot set an image tag. The Coolify application therefore tracks the
  mutable tag `ghcr.io/getlooma/docs:live`. CI pushes the immutable `:<sha>`, smoke-tests it,
  retags it as `:live` with `GITHUB_TOKEN` (`packages: write`), then triggers the deploy and polls
  it. Rollback: `workflow_dispatch` with `sha` retags `:live` to that image and redeploys.
- The token, `COOLIFY_URL` and the application UUID are **environment** secrets of the GitHub
  environment `production`, whose deployment branch rule allows only `main`. No pull request job
  can read them. Their values are never echoed, and `::add-mask::` covers the URL.
- `.github/` is owned by the owners in CODEOWNERS, so a workflow change needs their review.
- The image is public on GHCR. It holds only public docs, so the Coolify host needs no registry
  login for it.
- Apply verifies, with the owner, that a `read`+`deploy` token can call `POST /api/v1/deploy` and
  `GET /api/v1/deployments/{uuid}`, and that a Docker Image application re-pulls a mutable tag on
  deploy. If either is false, the fallback is to deploy from a private repository's workflow,
  triggered by this repository's `main` through a narrowly scoped dispatch. That choice goes back
  to the owner.

**Fallback host: GitHub Pages.** No secret at all (`actions/deploy-pages` with OIDC), a global CDN,
free for public repositories. It loses content negotiation, real `301`s (it keeps meta-refresh
redirects, which search engines treat as permanent), custom headers, a correct 404 status for
`.md` paths, and room for a runtime. Choose it if the owner prefers zero secrets over those
features.

**Rejected:**

- Cloudflare Pages or Netlify: real redirects and previews, but content negotiation needs their
  edge functions, it adds a vendor account and token, and it splits hosting from the rest of
  Looma.
- Railpack for the image: its static mode would hide the Caddyfile this design depends on.

**DNS (owner):** a record for docs.getlooma.io pointing at the Coolify host; Coolify issues the
certificate.

### D14. CI and fork safety

- **`ci.yml`:**
  - Triggers: `pull_request` and `push` to `main`.
  - Top-level `permissions: contents: read`.
  - Jobs:
    - `check`: Nix install and cache as in the other repositories, `pnpm install
--frozen-lockfile`, `nix develop -c just check`.
    - `image`: builds the Dockerfile without pushing, runs `scripts/smoke`.
    - `dco`.
  - `drafted-pr` is its own workflow, `drafted-pr.yml` (`pull_request` and `pull_request_review`).
    A skipped job in `ci.yml` on a review event would show up as a passing `check` run, so the
    review trigger stays out of `ci.yml`. It reads its check script from the base commit.
  - No secrets anywhere, so fork pull requests run it unchanged. `GITHUB_TOKEN` is read-only for
    forks anyway.
- **No `pull_request_target`, no `workflow_run`**, enforced by `check-workflows.mjs`. Those
  triggers run with the base repository's secrets, and with a checkout of fork code they are the
  classic way public repositories leak tokens.
- **Actions pinned to full commit SHAs** with a version comment. Dependabot keeps them current.
- **Repository settings, as code (`scripts/repo-settings`, D19):**
  - "Require approval for all external contributors" for workflow runs from forks.
  - Default `GITHUB_TOKEN` permission read-only; Actions may not create or approve pull requests.
  - Actions must be pinned to a full commit SHA (the repository setting, on top of
    `check-workflows.mjs`).
  - Squash merge only; head branches deleted after merge; issues and discussions on.
  - Secret scanning and push protection on.
  - The `main` ruleset is D19.
- **`pr-review.yml`:** the advisory review from the other repositories, with the same gating. It
  runs on same-repository pull requests (the docs bot's drafts, team members' branches), or on
  `/review` from an owner, member or collaborator, after a gate rejects fork pull requests. It
  uses `CLAUDE_CODE_OAUTH_TOKEN` and skips while that secret is unset. Its prompt adds a
  public-content pass: internal details, unreleased features, customer data, contradictions with
  other pages. It never blocks a merge. Forks never get it, because a fork's content would be a
  prompt-injection path to a job holding a token.
- **Runners:** `ubuntu-latest` (see Context).

### D15. Preview deploys: deferred

Pull request previews need either a second Coolify application per pull request or a hosted
preview service with a token. Both put a credential within reach of pull request workflows,
which is exactly what D14 avoids for forks. For now:

- `ci.yml` uploads `dist/` as an artifact (7-day retention) on every pull request, forks
  included, for reviewers who want to browse it locally (`npx serve dist`, documented in
  CONTRIBUTING).
- A later change can add previews for same-repository pull requests only, for example by having
  the docs bot's drafts and team branches deploy to `preview.docs.getlooma.io`.

### D16. Keeping internal details out

Three layers, because no single one is enough:

1. **At the source (drafting):** the drafting automation in the private repositories has its own
   instructions and a private denylist scan before it pushes. That is specified there, not here.
2. **Mechanical, here:** `scripts/check-public` runs on every pull request, drafted or not
   (requirement "Nothing internal reaches the public repository"). The patterns are generic on
   purpose. A list of real internal host names in a public repository would itself be the leak.
   The specific denylist lives on the private side.
3. **Human, here:** the code-owner review, with the template's "no internal details" checkbox and
   the advisory review's public-content pass for same-repository pull requests.

Also:

- This repository's issues, pull requests and OpenSpec changes are public too; `CLAUDE.md` says
  so.
- Screenshots use invented data. `SECURITY.md` explains how to report something sensitive found
  in the docs.
- If a secret is ever committed, it is rotated first; history is rewritten only after that.

### D17. Agent setup

- `CLAUDE.md`: what the repository is, that it is public, the commands, the IA, the style guide
  as binding, the never-in-public-docs list, OpenSpec flow, no global installs.
- `.claude/settings.json`: allow `just`, `pnpm`, `openspec`, `nix develop`, `vale`, the read-only
  `gh pr` commands and the same push denies as the other repositories.
- Skills: `openspec init --tools claude,agents` vendors the OpenSpec skills and `/opsx:*` commands
  (pinned by `scripts/openspec`). No Go skills apply; writing
  rules live in `STYLE_GUIDE.md`.

### D18. Receiving drafted pull requests

The drafting automation runs in the private repositories (its own change there). From this
repository's side:

- It opens pull requests as the Looma docs bot (a GitHub App installed on this repository only,
  with contents and pull requests write).
- It uses branches `drafts/<topic>` and the label `drafted`.
- The body is written in user terms and holds no private links.
- `drafted-pr.yml` enforces the label, the no-private-links rule and a maintainer's approval on `drafts/`
  branches.
- The bot never merges: the drafting workflow has no merge step, and a team member reviews,
  edits on the branch if needed, and merges. GitHub does not let an App approve its own pull
  request. In phase 1 (D19), with 0 required approvals, this rests on process: the App's token
  has contents write, so the API would let it merge. From phase 2 the `drafted-pr` status check
  also requires an approving review from a `@getLooma/docs-maintainers` member on `drafts/`
  branches (it reruns on `pull_request_review`), and from phase 3 the ruleset enforces approval
  for every pull request. The App is never in the bypass list.
- The label `drafted` lets the team measure how often drafts merge unchanged.

### D19. Merge rights and the `main` ruleset, in phases

**Who may do what:** anyone may open issues, join discussions and open pull requests from a
fork. Only `@getLooma/docs-maintainers` (an organization team, created by the owner) has write
access, so only its members can merge. Everyone else has read access. `CODEOWNERS` assigns `*`
to that team, and `/.github/` and `/scripts/` to the owner.

**The ruleset is code.** `.github/rulesets/main.json` is the request body of the active ruleset
`main` (id 26152208, applied by the owner on 2026-10-29), committed to match it exactly.
`just ruleset-apply` creates or updates it by name with `gh api`, and `just ruleset-check` diffs
the live ruleset against the file. Both need an admin login, so they run on the owner's machine,
never in CI. `check-repo.mjs` validates the file offline in `just check`. A change to the ruleset
is therefore a reviewed pull request first, then an apply.

The rules are phased because the owner is the only team member for now, and GitHub never lets
an author approve their own pull request.

| Phase       | Rules                                                                                                                                                                                                              | When                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------- |
| 1 (applied) | deletion blocked; no force pushes; pull request required with 0 approvals; stale reviews dismissed on push; review threads resolved; extra approval for unattributed changes; squash merge only; bypass list empty | now                               |
| 2           | required status checks from GitHub Actions (integration 15368), up to date with `main`: `check` (`just check`), `image`, and `dco` if the DCO is adopted; plus the `drafted-pr` check (D18)                        | when `ci.yml` is merged and green |
| 3           | `required_approving_review_count: 1`, `require_code_owner_review: true`, `require_last_push_approval: true`                                                                                                        | when a second team member joins   |

Each phase is a pull request that edits `main.json`, then `just ruleset-apply` and
`just ruleset-check`. Linear history needs no separate rule, because squash is the only merge
method.

**Bypass:** the list stays empty in every phase. If the owner wants an emergency bypass (for
example the organization admin role, "pull requests only"), it is added to `main.json` like any
other rule; this is an open question.

## Implementation notes (apply, 2026-10-29)

- **`llms.txt`:** the plugin's own `llms.txt` links only the bundle files. The page index the
  spec requires (every page, its `.md` URL and its description, by section) is passed in the
  plugin's `details` option, built in `astro.config.mjs` from the page frontmatter
  (`scripts/lib/pages.mjs`). No second route was needed.
- **`.md` copies:** `starlight-page-actions` writes them with the title as `h1` but without the
  description. A small local integration (`scripts/lib/markdown-copies.mjs`) inserts
  `> description` after the title at `astro:build:done`.
- **`description` is required:** `docsSchema({ extend })` does override Starlight's optional
  `description`. A page without one fails `just build` ("description: Required").
- **Sidebar:** Starlight 0.42 needs `{ label, items: [{ autogenerate }] }`, not a labelled
  `autogenerate`.
- **OG images:** `astro-og-canvas` needs `canvaskit-wasm` as a direct dependency under pnpm. The
  Inter fonts are vendored in `src/fonts/` (SIL OFL 1.1), so the build needs no network. With
  100 fixture pages the whole build took 5 s, far under the 60 s fallback threshold.
- **JavaScript budget:** the home page ships 12,266 bytes of client script, so the budget is
  14,720 (`scripts/budget.json`).
- **CSP:** Starlight inlines small scripts (theme) and Pagefind runs WebAssembly. `script-src`
  is therefore `'self' 'unsafe-inline' 'wasm-unsafe-eval'`, not `'self'` only. There is no
  third-party origin anywhere.
- **Trailing slash:** Caddy's own directory redirect is a 308. An explicit `@slashless` rule
  answers `/path` with a `301` to `/path/` when that page exists.
- **Vale** treats `.mdx` as Markdown (`[formats] mdx = md`), because Vale 3's MDX parser needs
  an extra npm tool.
- **Public-content scan:** the environment-variable rule applies to pages only. Tooling must name
  CI variables, and users never need internal ones. The allowlist holds the local dev and smoke
  addresses and the two examples in this change's own scenarios.
- **Placeholders:** the support address (product-question issue form), the code-of-conduct
  contact and the security email are `<…: to confirm>` placeholders. No check fails on them.
  The owner replaces them (tasks.md 9.9).
- **Bot identity:** `pr-review.yml` allows `looma-docs-bot[bot]`. If the App gets another slug,
  that line changes with it.
- **Logo:** `src/assets/logo.svg` and `public/favicon.svg` are a plain placeholder mark, because
  no Looma logo asset exists in the code repositories yet (tasks.md 9.9).

## Risks / Trade-offs

- **Phase 1 merges need no approval** → only team members can merge at all, and the only member
  is the owner. Outside pull requests still need a team member to merge them. Drafted pull
  requests rely on process until phase 2's `drafted-pr` check (D18). Phase 3 closes the gap as
  soon as there is a second reviewer.

- **A drafted page describes something not yet released** → the private side holds drafts until
  release. The human review here is the last gate, with the template checkbox "describes released
  behaviour".
- **A young plugin breaks or goes unmaintained** (`starlight-page-actions`, one maintainer) → it
  is isolated behind D1's fallbacks (`starlight-dot-md`, or our own endpoint). `check-site.mjs`
  tests the outputs, not the plugin, so a swap is safe.
- **The Coolify token in a public repository** → reduced to `read`+`deploy`, an environment
  limited to `main`, and owner review of `.github/` (D13). The GitHub Pages fallback removes it
  entirely.
- **Generic leak patterns give false positives** → the allowlist is owned by the owners and
  reviewed. False negatives are covered by layers 1 and 3 of D16.
- **Allowing AI crawlers** means the docs are used in training as well as citation. The owner
  accepted this for the goal of being cited.
- **Caddy is a new production component** for the team → a 30-line Caddyfile, pinned image,
  smoke-tested in CI on every pull request.

## Migration Plan

New site, nothing to migrate. Launch order: merge this change, owner settings and DNS (tasks
section 9), first deploy, Search Console. The first content change follows. Rollback is the
`deploy.yml` manual run with an earlier `sha`.

## Open Questions

- **CLA or DCO** (D5): DCO recommended.
- **The domain:** docs.getlooma.io assumed. Confirm it, and whether `getlooma.io/docs` should
  redirect there.
- **Hosting:** Coolify image (recommended) or GitHub Pages (zero secrets, fewer features). Also
  the Dockerfile exception to the no-Dockerfile convention.
- **Emergency bypass on the ruleset:** none today. Should the organization admin get a
  "pull requests only" bypass for emergencies (D19)?
- **Second team member:** who, and when? Phase 3 of the ruleset waits for them.
- **Product questions in issues:** the third issue form redirects to support. Which support
  address or URL should it link to?
- **A French locale at launch?** The structure allows it later. Say if it is needed sooner.
