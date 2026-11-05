## 1. Entry format

- [ ] 1.1 Add the `changelog` collection (glob loader, zod schema) to `src/content.config.ts`.
      Verify: an entry with `category: feature` fails `just build` (then remove it).
- [ ] 1.2 Write tests first in `scripts/test/check-repo.test.mjs` for the file name and date,
      unique slugs, body length, headings and the `docs` route; then extend
      `scripts/check-repo.mjs`. Verify: the new cases fail before, pass after (`just test`).

## 2. Page and section

- [ ] 2.1 Add `changelog` last in `src/sections.mjs`, `src/components/Changelog.astro` and
      `src/content/docs/changelog/index.mdx`; run `just routes`. Verify: `just build`, and the
      sidebar's last group is Changelog in `just dev`.
- [ ] 2.2 Add the first entry, announcing the changelog, written to the STYLE_GUIDE.md rules.
      Verify: `vale src/content` and `scripts/check-public` pass.
- [ ] 2.3 Write `check-site.mjs` tests first (date headings, anchors once, order), then the check.
      Verify: a fixture with a duplicated anchor fails.

## 3. Feed

- [ ] 3.1 Write the escaping helper's test first (`& < > " '`), then
      `src/pages/changelog/feed.xml.ts` and the alternate link in `src/components/Head.astro`.
      Verify: the test passes; `check-site.mjs` parses the feed and counts its entries.
- [ ] 3.2 Fetch `/changelog/feed.xml` in `scripts/smoke`. Verify: `just image` passes, and
      `scripts/smoke --local dist` passes.

## 4. Agents

- [ ] 4.1 Make `scripts/lib/markdown-copies.mjs` write the changelog page's copy from the entries;
      add the `check-site.mjs` assertion on `/changelog.md` and `/llms-full.txt`. Verify: the
      assertion fails before, passes after.

## 5. Writing rules

- [ ] 5.1 Add "Changelog entries" to `STYLE_GUIDE.md` (design.md D7), the collection to
      `CLAUDE.md`, and the checkbox to `.github/PULL_REQUEST_TEMPLATE.md`. Verify: `just fmt-check`.

## 6. Final check

- [ ] 6.1 `just check` passes.
