## ADDED Requirements

### Requirement: Changelog entries have a fixed, checked format

Each changelog entry SHALL be a Markdown file in `src/content/changelog/` named
`YYYY-MM-DD-<slug>.md`, where the date equals the entry's `date` and the slug is lowercase and
hyphen-separated and unique across all entries. Its frontmatter SHALL have `date`, `title` (1 to
70 characters) and `category` (one of `new`, `improved`, `fixed`), and MAY have `docs`, a route
that is listed in `published-routes.txt` and is not a redirect source. Its body SHALL be at most
600 characters and SHALL contain no heading. `just check` SHALL fail on any violation, naming
the file.

#### Scenario: An unknown category fails the build

- **WHEN** an entry has `category: feature`
- **THEN** `just build` fails, naming the entry and the allowed categories

#### Scenario: A file name that disagrees with the date fails

- **WHEN** `src/content/changelog/2026-11-12-snooze.md` has `date: 2026-11-13`
- **THEN** `node scripts/check-repo.mjs` exits non-zero, naming the file

#### Scenario: A docs link to a missing page fails

- **WHEN** an entry has `docs: /inbox/no-such-page/`
- **THEN** `node scripts/check-repo.mjs` exits non-zero, naming the entry and the route

#### Scenario: A long or structured body fails

- **WHEN** an entry's body is 601 characters, or contains a line starting with `## `
- **THEN** `node scripts/check-repo.mjs` exits non-zero

### Requirement: The changelog page lists every entry

The site SHALL have a section `changelog` whose page `/changelog/` lists every entry, newest date
first, with one `h2` per date and one `h3` per entry carrying the anchor `#<slug>`, the category
shown as New, Improved or Fixed, the body, and a link to the `docs` route when set. The page
SHALL load no client JavaScript. Its Markdown copy and `llms-full.txt` SHALL contain every
entry's title.

#### Scenario: Every entry is on the page once

- **WHEN** the site is built with three entries on two dates
- **THEN** `node scripts/check-site.mjs dist` finds two date headings and each entry's anchor
  exactly once, in date order

#### Scenario: Agents see the entries

- **WHEN** the site is built
- **THEN** `/changelog.md` and `/llms-full.txt` contain each entry's title, checked by
  `check-site.mjs`

### Requirement: The changelog has an Atom feed

The site SHALL publish `/changelog/feed.xml`, an Atom 1.0 feed of the 50 newest entries. Each feed
entry SHALL have the id `tag:docs.getlooma.io,<date>:<slug>`, a link to
`https://docs.getlooma.io/changelog/#<slug>`, the title, the category, and the body as escaped
HTML. The changelog page SHALL link the feed with
`<link rel="alternate" type="application/atom+xml">`. All text SHALL be XML-escaped.

#### Scenario: The feed parses and is complete

- **WHEN** the site is built with three entries
- **THEN** `check-site.mjs` parses `dist/changelog/feed.xml` and finds three `entry` elements
  with the expected ids and links

#### Scenario: Special characters are escaped

- **WHEN** the escaping helper's test renders an entry titled `Tags & <filters> "now"`
- **THEN** the feed text is `Tags &amp; &lt;filters&gt; &quot;now&quot;` and the XML parses

#### Scenario: The image serves the feed

- **WHEN** `scripts/smoke` runs against the built image
- **THEN** `/changelog/feed.xml` answers 200 with an XML content type
