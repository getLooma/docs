// The changelog (openspec change `changelog`): entries in src/content/changelog/, rendered on
// /changelog/, in its Markdown copy and in the Atom feed /changelog/feed.xml. Plain JavaScript so
// the Astro component, the feed endpoint and the check scripts share one implementation.
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';

export const changelogDir = 'src/content/changelog';
export const FEED_PATH = '/changelog/feed.xml';
export const FEED_LIMIT = 50;
export const CATEGORIES = { new: 'New', improved: 'Improved', fixed: 'Fixed' };

/** `2026-11-03-looma-is-live` → `looma-is-live`: the entry's anchor and feed id. */
export const slugOf = (id) => id.replace(/^\d{4}-\d{2}-\d{2}-/, '');

/** A `date` from YAML (a string) or from Astro's loader (a Date) as `YYYY-MM-DD`. */
export const isoDate = (date) =>
  date instanceof Date ? date.toISOString().slice(0, 10) : String(date);

/** `2026-11-03` → `November 3, 2026`. */
export const formatDate = (date) =>
  new Date(`${isoDate(date)}T00:00:00Z`).toLocaleDateString('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

/** Newest date first; within a day, by slug. */
export function sortNewestFirst(entries) {
  return [...entries].sort(
    (a, b) =>
      isoDate(b.date).localeCompare(isoDate(a.date)) || slugOf(a.id).localeCompare(slugOf(b.id))
  );
}

/** Sorted entries → [{ date, entries }] in the same order. */
export function groupByDate(sorted) {
  const groups = [];
  for (const e of sorted) {
    const date = isoDate(e.date);
    if (groups.at(-1)?.date !== date) groups.push({ date, entries: [] });
    groups.at(-1).entries.push(e);
  }
  return groups;
}

export const escapeXml = (s) =>
  String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

/**
 * Atom 1.0 for the newest FEED_LIMIT entries. Each entry: { id, date, title, category, html }.
 * @param {string} site the site origin, e.g. https://docs.getlooma.io
 */
export function atomFeed(entries, site) {
  const sorted = sortNewestFirst(entries).slice(0, FEED_LIMIT);
  const host = new URL(site).host;
  const page = new URL('/changelog/', site).href;
  const updated = sorted.length ? `${isoDate(sorted[0].date)}T00:00:00Z` : '2026-11-03T00:00:00Z';
  const items = sorted.map((e) => {
    const date = isoDate(e.date);
    const slug = slugOf(e.id);
    return [
      '  <entry>',
      `    <id>tag:${escapeXml(host)},${date}:${escapeXml(slug)}</id>`,
      `    <title>${escapeXml(e.title)}</title>`,
      `    <link rel="alternate" type="text/html" href="${escapeXml(`${page}#${slug}`)}"/>`,
      `    <updated>${date}T00:00:00Z</updated>`,
      `    <category term="${escapeXml(e.category)}" label="${escapeXml(CATEGORIES[e.category] ?? e.category)}"/>`,
      `    <content type="html">${escapeXml(e.html ?? '')}</content>`,
      '  </entry>',
    ].join('\n');
  });
  return [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<feed xmlns="http://www.w3.org/2005/Atom">',
    `  <id>${escapeXml(page)}</id>`,
    '  <title>Looma changelog</title>',
    '  <subtitle>What is new, improved and fixed in Looma.</subtitle>',
    `  <link rel="alternate" type="text/html" href="${escapeXml(page)}"/>`,
    `  <link rel="self" type="application/atom+xml" href="${escapeXml(new URL(FEED_PATH, site).href)}"/>`,
    `  <updated>${updated}</updated>`,
    '  <author><name>Looma</name></author>',
    ...items,
    '</feed>',
    '',
  ].join('\n');
}

/** Sorted entries ({ date, title, category, docs?, body }) as the page's Markdown text. */
export function changelogMarkdown(sorted, site) {
  return groupByDate(sorted)
    .map(({ date, entries }) =>
      [
        `## ${formatDate(date)}`,
        ...entries.map((e) =>
          [
            `### ${e.title}`,
            `_${CATEGORIES[e.category] ?? e.category}_`,
            e.body.trim(),
            ...(e.docs ? [`[Read the docs](${new URL(e.docs, site).href})`] : []),
          ].join('\n\n')
        ),
      ].join('\n\n')
    )
    .join('\n\n');
}

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

/** Every `.md` file in dir as { file, id, ...frontmatter, body }, sorted by file name. */
export function readEntries(dir = changelogDir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .sort()
    .map((file) => {
      const source = fs.readFileSync(path.join(dir, file), 'utf8');
      const match = FRONTMATTER.exec(source);
      const data = match ? (parse(match[1]) ?? {}) : {};
      const body = (match ? source.slice(match[0].length) : source).trim();
      return {
        ...data,
        date: data.date === undefined ? undefined : isoDate(data.date),
        file,
        id: file.replace(/\.md$/, ''),
        body,
      };
    });
}
