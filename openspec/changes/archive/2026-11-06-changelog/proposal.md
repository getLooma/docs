## Why

Looma's users have no single place to see what changed in the product. The docs pages say how
Looma works today, but not what is new, what got better or what was fixed. The owner wants a
public changelog, fed the same way the docs are: drafted from merged work, reviewed by a person,
and published with the site.

This change adds the changelog to this site: where entries live, what an entry holds, how they
render, and a feed. Producing entries is a separate change on the drafting side. Until it lands,
a maintainer can add an entry by hand in any pull request.

## What Changes

- **New content collection `changelog`** (`src/content.config.ts`), loaded from
  `src/content/changelog/`. One Markdown file per entry, named `YYYY-MM-DD-<slug>.md`, with a
  required `date`, `title` (at most 70 characters) and `category` (`new`, `improved` or
  `fixed`), and an optional `docs` route that links the page where the change is documented. The
  body is one or two short paragraphs, at most 600 characters, without headings.
- **New section `changelog`** in `src/sections.mjs`, last in the sidebar, with one page,
  `src/content/docs/changelog/index.mdx` (route `/changelog/`). It renders every entry, newest
  first, grouped by date, through a new component `src/components/Changelog.astro`. Each entry has
  a stable anchor, `#<slug>`, and a category badge. The route is recorded in
  `published-routes.txt`.
- **New Atom feed** at `/changelog/feed.xml`, built by a new endpoint
  `src/pages/changelog/feed.xml.ts` without any new dependency. It lists the 50 newest entries.
  Every page links it with `<link rel="alternate" type="application/atom+xml">` in
  `src/components/Head.astro`, so feed readers find it from any page; the changelog page also
  links it visibly.
- **Agents and Markdown.** The page's Markdown copy (`scripts/lib/markdown-copies.mjs`) and the
  llms.txt files carry the entries as text, so an assistant reading the docs sees them too.
- **Checks.** `scripts/check-repo.mjs` checks entry file names, body length, the absence of
  headings and that a `docs` route is a published page. `scripts/check-site.mjs` checks that the
  built page shows every entry and that the feed parses and lists them. `scripts/smoke` fetches
  the feed. Vale and `scripts/check-public` already cover `src/content/`, so entries are
  prose-linted and scanned like pages.
- **Contributing.** `STYLE_GUIDE.md` gains a "Changelog entries" section (what to announce, the
  three categories, tone). `CLAUDE.md` names the collection.

## Non-goals

- Drafting entries automatically. That belongs to the drafting side (its own change). This repo
  only defines the format and renders it.
- One page per entry, tags, search filters or pagination. A single page is enough for years of
  entries; pagination can come when the page is slow.
- An in-app "What's new" panel or email digests. Both can read the feed later.
- Version numbers. Looma is a continuously deployed service, so entries are dated, not versioned.
- Announcing unreleased or planned work, or security fixes before they are disclosed. Docs
  follow releases, and so does the changelog.

## Capabilities

### New Capabilities

- `docs-changelog`: the entry format, the changelog page, the feed, and their checks.

### Modified Capabilities

- `docs-site`: the information architecture gains the `changelog/` section.

## Impact

- New: `src/content/changelog/` (the first entry, "Looma is live", dated 2026-11-03: what Looma
  does today, design.md D8), `src/lib/changelog.mjs` (shared by the page, the feed and the checks),
  `src/content/docs/changelog/index.mdx`, `src/components/Changelog.astro`,
  `src/pages/changelog/feed.xml.ts`, tests under `scripts/test/`.
- Changed: `src/content.config.ts`, `src/sections.mjs`, `src/components/Head.astro`,
  `scripts/lib/markdown-copies.mjs`, `scripts/check-repo.mjs`, `scripts/check-site.mjs`,
  `scripts/smoke`, `published-routes.txt`, `STYLE_GUIDE.md`, `CLAUDE.md`,
  `.github/PULL_REQUEST_TEMPLATE.md` (a checkbox: "a changelog entry, if users should hear about
  this").
- No new dependency, workflow or secret. CI and deploy run as today.
