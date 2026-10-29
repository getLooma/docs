## 1. Tooling and repository basics

- [ ] 1.1 Extend `flake.nix` with `vale`, `lychee`, `gitleaks` and `actionlint` (keep Node 22, pnpm, Prettier, just). Verify: `nix develop -c bash -c 'vale --version && lychee --version && gitleaks version && actionlint --version'` and `git diff --exit-code flake.lock`.
- [ ] 1.2 Add `package.json` with the exact versions from design.md D1, `"packageManager"` pinned to the shell's pnpm, and scripts `dev`, `build`, `test`, `prepare` (`husky`); run `pnpm install`, commit `pnpm-lock.yaml`. Verify: `pnpm install --frozen-lockfile` on a clean clone succeeds and `pnpm ls --depth 0` shows exactly the D1 versions.
- [ ] 1.3 Add `.editorconfig`, `.prettierignore` (lockfile, `dist/`, `.astro/`, `openspec/specs/`, `.claude/commands/opsx/`, vendored skills, `LICENSE-docs`) and `prettier-plugin-astro` to `.prettierrc`; add `.husky/pre-commit` and `.lintstagedrc.json` mirroring the other repositories (falls back to `nix develop -c` outside the shell). Verify: committing an unformatted Markdown file reformats and re-stages it.
- [ ] 1.4 Add the `justfile` (`dev`, `build`, `fmt`, `fmt-check`, `test`, `routes`, `check` as in design.md D9). Verify: `just --list` shows each recipe.
- [ ] 1.5 Run `openspec init --tools claude,agents` to vendor the OpenSpec skills and `/opsx:*` commands; add `.claude/settings.json` (design.md D17) and `CLAUDE.md`. Verify: `openspec list` works and `CLAUDE.md` contains the "public repository" and "never in public docs" rules.

## 2. The site

- [ ] 2.1 Write `scripts/check-repo.mjs` tests first (fixtures: a range version, a page outside the sections, an uppercase file name, a `client:` directive, an unlabelled fence, a missing license, a template without the checklist, CODEOWNERS without `/.github/`), then the script. Verify: each fixture fails with its file named, the passing fixture passes.
- [ ] 2.2 Add `astro.config.mjs` (`site`, `trailingSlash: 'always'`, `build.format: 'directory'`, root locale `en`, `editLink`, `lastUpdated`, sidebar, the four plugins from D1 with D7's options, `redirects` read from `redirects.json`) and `src/content.config.ts` (required `description` 50–160, `title` ≤ 60, optional `faq`). Verify: a page without `description` makes `just build` fail; confirm whether `extend` overrides Starlight's optional `description` and record the answer in design.md D8.
- [ ] 2.3 Add `src/content/docs/index.mdx` (home: a title, a description, one paragraph saying what the docs cover; no feature content) and `src/assets/` logo. Verify: `just build` writes `dist/index.html` and `dist/index.md`.
- [ ] 2.4 Add `Footer.astro` (CC BY 4.0 notice) and `Head.astro` overrides (alternate Markdown link, `og:image`, JSON-LD per D8). Verify: by 3.1's checks.
- [ ] 2.5 Add `src/pages/og/[...slug].png.ts` with `astro-og-canvas`. Verify: every page's `og:image` exists in `dist/`; time the build with 100 generated fixture pages and fall back to one static image if it exceeds 60 s (record the result in design.md D8).
- [ ] 2.6 Add `src/pages/robots.txt.ts` per D7. Verify: by 3.1's robots check.
- [ ] 2.7 Check the plugin outputs against the spec: the `.md` copies (title `h1`, description, no frontmatter or imports) and `llms.txt` (every page with its description). Apply design.md D1's fallbacks if either falls short and record which was used. Verify: by 3.1.

## 3. Checks on the built site

- [ ] 3.1 Write `scripts/check-site.mjs` tests first with fixture `dist/` trees, covering each docs-discoverability rule: one `h1`, heading order, alt text, unique titles and descriptions, description length, canonical URL, `lang`, Open Graph and Twitter tags, JSON-LD parse and breadcrumb match, `FAQPage`, `.md` twins and their content, `llms.txt` and `llms-full.txt` non-empty and complete, sitemap complete without redirect sources, `robots.txt` groups and `Sitemap:`, edit links, the JS budget. Then the script. Verify: each failing fixture fails naming the page, the passing fixture passes.
- [ ] 3.2 Record `scripts/budget.json` from the first real build plus 20 percent. Verify: adding a 50 KB inline script to the home page fails the check.
- [ ] 3.3 Write `scripts/check-routes.mjs` and `scripts/routes.mjs` tests first (deleted page without redirect, unrecorded new page, redirect to a missing page, redirect chain, `_redirects.caddy` rendering), then the scripts and an initial `published-routes.txt` and empty `redirects.json`. Verify: the fixtures behave as the spec's scenarios; `just routes` only ever appends.

## 4. Public-content safety and prose

- [ ] 4.1 Write `scripts/check-public` tests first (fixtures: an RFC 1918 URL, `localhost:5173`, a `.internal` host, a private registry path, a link to another `getLooma` repository, an env-var-like name, a fake secret that gitleaks detects, and an allowlisted line), then the script (gitleaks `--no-git` over tracked files plus the patterns) and an empty `scripts/public-allowlist.txt`. Verify: each fixture fails naming file and line; the allowlisted one passes.
- [ ] 4.2 Add `.vale.ini` and `styles/Looma/` (`Terms.yml`, `Headings.yml`, `Weasel.yml`). Verify: a fixture page saying "ticket cluster" fails at `error` level; the home page passes.

## 5. Contributor files

- [ ] 5.1 Write `LICENSE` (MIT, "Looma contributors") and `LICENSE-docs` (CC BY 4.0 legal code, verbatim from creativecommons.org), and the License section of `README.md` (D4). Verify: 2.1's license check passes.
- [ ] 5.2 Write `CONTRIBUTING.md` per design.md D5 (using the owner's DCO/CLA answer), `CODE_OF_CONDUCT.md` (Contributor Covenant 2.1, with the owner's contact) and `SECURITY.md` (how to report privately; scope: the site and its content). Verify: Prettier and Vale pass; the owner confirms the contact addresses.
- [ ] 5.3 Write `STYLE_GUIDE.md` per design.md D6, with a skeleton for each page type. Verify: Vale passes on it; the examples in it use invented data only.
- [ ] 5.4 Add `.github/PULL_REQUEST_TEMPLATE.md`, `.github/ISSUE_TEMPLATE/` (three forms and `config.yml`), `.github/CODEOWNERS` and `.github/dependabot.yml` (npm, github-actions, docker; weekly). Verify: 2.1's template and CODEOWNERS checks pass.

## 6. CI

- [ ] 6.1 Write `scripts/check-workflows.mjs` tests first (fixtures: `pull_request_target`, `workflow_run`, missing top-level `permissions`, an action pinned by tag, `secrets.` in `ci.yml`), then the script. Verify: each fixture fails; `actionlint` passes on the real workflows.
- [ ] 6.2 Add `.github/workflows/ci.yml` per design.md D14: `check`, `image` (build without push plus `scripts/smoke`), `dco`, `drafted-pr`, and the `dist/` artifact upload. Verify: a pull request from a fork runs green without secrets (test with a throwaway fork); a commit without sign-off fails `dco`.
- [ ] 6.3 Add `.github/workflows/links.yml` per D11. Verify: a manual run over a fixture page with a dead external link opens one `broken-links` issue, and a second run updates the same issue.
- [ ] 6.4 Add `.github/workflows/pr-review.yml` (mirror of the other repositories' advisory review, with the public-content pass in the prompt). Verify: it skips on a fork pull request and on a pull request while `CLAUDE_CODE_OAUTH_TOKEN` is unset.

## 7. Image and server

- [ ] 7.1 Add `Dockerfile`, `.dockerignore` and `deploy/Caddyfile` per design.md D13 (Caddy `2.11.7-alpine` by digest, port 8080). Verify: `docker build` succeeds and the image runs as a non-root user.
- [ ] 7.2 Write `scripts/smoke` (runs the image, then checks: `/` 200 with the security headers and `Vary: Accept`; `/getting-started/`-style page with `Accept: text/markdown` returns its Markdown with the right content type (use the home page until sections exist); a fixture redirect returns 301 with `Location`; `/no-such-page/` returns 404 with the 404 page; `/robots.txt`, `/llms.txt`, `/sitemap-index.xml` are 200; `/path` without slash returns 301 to `/path/`). Verify: it passes on the real image and fails when the `@md` block is removed from the Caddyfile.

## 8. Deploy

- [ ] 8.1 Add `.github/workflows/deploy.yml` per design.md D13: on push to `main` and `workflow_dispatch` (`sha`); `just check`, build, smoke, push `:<sha>`, retag `:live`, then a `deploy` job in environment `production` that calls Coolify's deploy endpoint and polls the deployment, masking the URL. The job skips with a notice while the environment's secrets are unset. Verify: `check-workflows.mjs` and `actionlint` pass; a run before the owner's setup skips the deploy step green.
- [ ] 8.2 With the owner: confirm that a `read`+`deploy` Coolify token can trigger and read a deployment and that the Docker Image application re-pulls `:live` on deploy. Verify: a manual deploy of the first `main` image finishes and serves the new `index.html`. If not, stop and take design.md D13's fallback question back to the owner.
- [ ] 8.3 Rollback drill: run `deploy.yml` by hand with the previous `sha`, then the current one. Verify: `:live` moves both times, only the deploy runs, and the site serves each version.

## 9. Owner actions (human)

- [ ] 9.1 Repository settings per design.md D14: fork-PR workflow approval for external contributors, read-only default `GITHUB_TOKEN`, Actions may not approve pull requests, branch protection on `main` (code-owner review; `check`, `image`, `dco` required; linear history), secret scanning with push protection, labels `drafted` and `broken-links`, the code-owners team. Verify: `gh api repos/getLooma/docs/branches/main/protection` shows the rules.
- [ ] 9.2 Create the Coolify Docker Image application (`ghcr.io/getlooma/docs:live`, port 8080, domain docs.getlooma.io), a Coolify token with only `read` and `deploy`, and the GitHub environment `production` (deployment branches: `main` only) holding `COOLIFY_API_TOKEN`, `COOLIFY_URL`, `COOLIFY_APP_UUID`; point DNS for docs.getlooma.io at the host; make the GHCR package `docs` public. Verify: `curl -sI https://docs.getlooma.io/` returns 200 over HTTPS after the first deploy.
- [ ] 9.3 Install the Looma docs bot GitHub App on this repository only, with contents and pull requests write (used by the drafting automation in the private repositories). Verify: the App's installation lists only `getLooma/docs`.
- [ ] 9.4 Verify docs.getlooma.io in Google Search Console and Bing Webmaster Tools by DNS TXT record and submit `https://docs.getlooma.io/sitemap-index.xml`. Verify: both consoles show the sitemap as read without errors.

## 10. Final check

- [ ] 10.1 `just check` passes on a clean clone in the dev shell, and `ci.yml` is green on the pull request.
