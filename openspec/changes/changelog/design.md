## Context

The site is Astro Starlight: pages under `src/content/docs/<section>/`, sections in
`src/sections.mjs`, checks in `scripts/`, deploy of `main` as an image. Docs pull requests come
from people and from the Looma docs bot (`drafts/` branches), and a maintainer reviews every one.
This change adds a changelog that fits that flow: an entry is a small file, added in the same
pull request as the docs it relates to, reviewed with it, and published on merge.

## Goals / Non-Goals

**Goals:** one public page of dated entries; a format small enough for a person or the docs bot
to write without mistakes; a feed; checks that keep entries short, linked and public-safe.

**Non-goals:** see proposal.md. In short: no drafting automation here, no in-app panel, no
per-entry pages, no versions.

## Decisions

### D1. Where the changelog lives: the docs site (recommended)

| Option                                                | For                                                                                                                                                  | Against                                                                                                      |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **`docs.getlooma.io/changelog/` (this change)**       | Already public, reviewed and deployed per merge; the docs bot already writes here; entries can link the page they change; feed and llms.txt for free | A second place to look for people who live in the app                                                        |
| A route in the app (`getlooma.io/changelog`)          | Where users already are                                                                                                                              | Private code, no public review flow, a deploy of the app for every text fix; the app has no content pipeline |
| Both: an in-app "What's new" reading this site's feed | Best reach                                                                                                                                           | Cross-origin fetch, unread state per user: a product feature of its own                                      |

The docs site is the source. The app can point at it (a redirect from `getlooma.io/changelog`,
like `getlooma.io/docs` today, is the drafting change's business) and can read the feed later.

### D2. Entries are a separate content collection, rendered on one page

Each entry is `src/content/changelog/YYYY-MM-DD-<slug>.md`:

```markdown
---
date: 2026-11-12
title: Snooze a conversation until later
category: new
docs: /inbox/snooze/
---

Agents can snooze a conversation for an hour, until tomorrow or until a date they pick. It comes
back to the top of the inbox when the time is up, or as soon as the customer replies.
```

- `date` is the day the entry is published; `category` is one of `new`, `improved`, `fixed`
  (shown as New, Improved, Fixed); `docs` is optional and must be a published route.
- The collection uses Astro's built-in `glob` loader and a zod schema in
  `src/content.config.ts`, so a bad entry fails the build like a bad page does.
- The slug is unique (the file name enforces it within a day; `check-repo` across days), and is
  the entry's anchor and feed id: links to `/changelog/#<slug>` never break.

Alternative considered: one docs page per entry under `src/content/docs/changelog/`. It reuses
every page check, the sitemap and OG images, but fills the sidebar with dozens of thin pages and
forces a 50–160 character `description` on each. Rejected.

### D3. The page

`src/content/docs/changelog/index.mdx` (title "Changelog", the usual description) imports
`src/components/Changelog.astro`, which calls `getCollection('changelog')`, sorts by date then
slug, and renders an `h2` per date and an `h3` per entry with its badge, body and "Read the docs"
link. That keeps the heading order the built-site check requires. No client JavaScript: the
page stays within the existing budget. The section `changelog` is added last in
`src/sections.mjs` with the label "Changelog".

### D4. The feed: Atom, written by hand

`src/pages/changelog/feed.xml.ts` returns Atom 1.0 for the 50 newest entries: feed `id`
`https://docs.getlooma.io/changelog/`, entry `id` `tag:docs.getlooma.io,<date>:<slug>`, `link` to
the anchor, `updated` from `date`, `category` term, and the body rendered to HTML as escaped
`content type="html"`. Atom rather than RSS: one well-specified format that every reader takes.
No dependency: `@astrojs/rss` writes RSS only and the XML is twenty lines. Every text node is
XML-escaped by one tested helper.

### D5. Agents read it too

`scripts/lib/markdown-copies.mjs` writes the changelog page's Markdown copy from the entries
(date heading, title, category, body, docs link) rather than from the MDX source, which only
holds the component import. llms-full.txt is built from the same copy. `check-site` asserts that
both contain every entry's title.

### D6. Checks (all in `just check`)

- `check-repo.mjs`: file name `^\d{4}-\d{2}-\d{2}-[a-z0-9]+(-[a-z0-9]+)*\.md$` matching the `date`;
  unique slugs; body at most 600 characters with no heading; `docs`, when set, is listed in
  `published-routes.txt` and is not a redirect source.
- `check-site.mjs`: the built `/changelog/` shows each entry's anchor once; `/changelog/feed.xml`
  parses (node-html-parser in XML mode, already a dev dependency) and has one `entry` per
  collection entry up to 50; the alternate link is present.
- `scripts/smoke`: `/changelog/feed.xml` answers 200 with an XML content type from the image.
  `deploy/Caddyfile` already serves `.xml` from the sitemap; the smoke test proves it.
- Vale (`vale src/content`) and `scripts/check-public` already cover `src/content/changelog/`.

### D7. What may be announced (STYLE_GUIDE.md)

An entry announces a released change a user can notice: a new feature, a visible improvement, a
fix of something users hit. Never: internal work, infrastructure, performance numbers, vendors,
security fixes (until the owner discloses them), unreleased or flagged work, dates of future
releases. Write it like a page's first paragraph: what users can now do, in one or two sentences.

## Keeping internal details out

Entries live in `src/content/`, so the existing public-content scan, Vale and the maintainer
review apply. The drafting side adds its own denylist scan before a drafted entry is pushed. The
style guide rule in D7 is what a reviewer checks. The feed and the page carry only entry fields:
no commit, pull request or author data.

## Dependencies

None added. Astro's `glob` loader and `getCollection` ship with the pinned `astro` 7.4.0;
`node-html-parser` 9.0.4 is already a dev dependency.

## CI cost

None added. This repository is public, so its GitHub-hosted runs cost no minutes, and an entry
rides in a docs pull request that runs CI and deploys anyway. The build grows by one page and one
endpoint.

## Risks / Trade-offs

- **The page grows forever.** Fine for years at a few entries a week; paginate by year later.
- **A drafted entry may overstate a change.** The maintainer review is the control, as for pages.
- **Entries dated at draft time, merged later.** The reviewer fixes `date` before merging; the
  style guide says so.

## Open Questions

- Should the first entry backfill the features already released (one "Looma today" entry), or
  start empty with only the changelog's own announcement? Recommended: the latter.
