## 1. Entry format

- [x] 1.1 Add the `changelog` collection (glob loader, zod schema) to `src/content.config.ts`.
      Verify: an entry with `category: feature` fails `just build` (then remove it).
- [x] 1.2 Write tests first in `scripts/test/check-repo.test.mjs` for the file name and date,
      unique slugs, body length, headings and the `docs` route; then extend
      `scripts/check-repo.mjs`. Verify: the new cases fail before, pass after (`just test`).

## 2. Page and section

- [x] 2.1 Add `changelog` last in `src/sections.mjs`, `src/components/Changelog.astro` and
      `src/content/docs/changelog/index.mdx`; run `just routes`. Verify: `just build`, and the
      sidebar's last group is Changelog in `just dev`.
- [x] 2.2 Add the first entry, "Looma is live" (2026-11-03, design.md D8), each claim checked
      against the released product, written to the STYLE_GUIDE.md rules.
      Verify: `vale src/content` and `scripts/check-public` pass.
- [x] 2.3 Write `check-site.mjs` tests first (date headings, anchors once, order), then the check.
      Verify: a fixture with a duplicated anchor fails.

## 3. Feed

- [x] 3.1 Write the escaping helper's test first (`& < > " '`), then
      `src/pages/changelog/feed.xml.ts` and the alternate link in `src/components/Head.astro`.
      Verify: the test passes; `check-site.mjs` parses the feed and counts its entries.
- [x] 3.2 Fetch `/changelog/feed.xml` in `scripts/smoke`. Verify: `just image` passes, and
      `scripts/smoke --local dist` passes.

## 4. Agents

- [x] 4.1 Make `scripts/lib/markdown-copies.mjs` write the changelog page's copy from the entries;
      add the `check-site.mjs` assertion on `/changelog.md` and `/llms-full.txt`. Verify: the
      assertion fails before, passes after.

## 5. Writing rules

- [x] 5.1 Add "Changelog entries" to `STYLE_GUIDE.md` (design.md D7), the collection to
      `CLAUDE.md`, and the checkbox to `.github/PULL_REQUEST_TEMPLATE.md`. Verify: `just fmt-check`.

## 6. Final check

- [x] 6.1 `just check` passes.
