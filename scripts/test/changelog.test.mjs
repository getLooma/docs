import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse, valid } from 'node-html-parser';
import { checkChangelogFiles } from '../check-repo.mjs';
import { changelogSiteErrors } from '../check-site.mjs';
import {
  atomFeed,
  changelogMarkdown,
  escapeXml,
  groupByDate,
  readEntries,
  slugOf,
  sortNewestFirst,
} from '../../src/lib/changelog.mjs';
import { sections } from '../../src/sections.mjs';
import { withChangelog } from '../lib/markdown-copies.mjs';
import { tempDir, write } from './helpers.mjs';

const entry = (fm, body = 'Sample entry text for the test.\n') =>
  `---\n${Object.entries(fm)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')}\n---\n\n${body}`;

function repo() {
  const root = tempDir();
  write(root, 'published-routes.txt', '/\n/inbox/sample/\n/inbox/old/\n');
  write(root, 'redirects.json', JSON.stringify([{ from: '/inbox/old/', to: '/inbox/sample/' }]));
  write(
    root,
    'src/content/changelog/2026-11-12-sample.md',
    entry({ date: '2026-11-12', title: 'Sample change', category: 'new' })
  );
  return root;
}

describe('changelog entries (check-repo)', () => {
  it('passes a valid entry', () => {
    expect(checkChangelogFiles(repo())).toEqual([]);
  });

  it('rejects a file name that disagrees with the date', () => {
    const root = repo();
    write(
      root,
      'src/content/changelog/2026-11-12-other.md',
      entry({ date: '2026-11-13', title: 'Other', category: 'fixed' })
    );
    expect(checkChangelogFiles(root).join('\n')).toMatch(/2026-11-12-other\.md: .*date/);
  });

  it('rejects a bad file name', () => {
    const root = repo();
    write(
      root,
      'src/content/changelog/Sample_Again.md',
      entry({ date: '2026-11-12', title: 'X', category: 'new' })
    );
    expect(checkChangelogFiles(root).join('\n')).toMatch(/Sample_Again\.md: name/);
  });

  it('rejects a slug used twice across days', () => {
    const root = repo();
    write(
      root,
      'src/content/changelog/2026-11-13-sample.md',
      entry({ date: '2026-11-13', title: 'Sample again', category: 'improved' })
    );
    expect(checkChangelogFiles(root).join('\n')).toMatch(/slug "sample" is also used/);
  });

  it('rejects an unknown category and a long title', () => {
    const root = repo();
    write(
      root,
      'src/content/changelog/2026-11-14-x.md',
      entry({ date: '2026-11-14', title: 'T'.repeat(71), category: 'feature' })
    );
    const out = checkChangelogFiles(root).join('\n');
    expect(out).toMatch(/category "feature"/);
    expect(out).toMatch(/title is 71 characters/);
  });

  it('rejects a docs link to a page that is not published, or moved', () => {
    const root = repo();
    write(
      root,
      'src/content/changelog/2026-11-14-x.md',
      entry({ date: '2026-11-14', title: 'X', category: 'new', docs: '/inbox/no-such-page/' })
    );
    write(
      root,
      'src/content/changelog/2026-11-14-y.md',
      entry({ date: '2026-11-14', title: 'Y', category: 'new', docs: '/inbox/old/' })
    );
    const out = checkChangelogFiles(root).join('\n');
    expect(out).toMatch(/2026-11-14-x\.md: docs \/inbox\/no-such-page\/ is not a published page/);
    expect(out).toMatch(/2026-11-14-y\.md: docs \/inbox\/old\/ is not a published page/);
  });

  it('rejects a long body or a heading', () => {
    const root = repo();
    write(
      root,
      'src/content/changelog/2026-11-14-long.md',
      entry({ date: '2026-11-14', title: 'Long', category: 'new' }, `${'a'.repeat(601)}\n`)
    );
    write(
      root,
      'src/content/changelog/2026-11-14-heading.md',
      entry({ date: '2026-11-14', title: 'Heading', category: 'new' }, '## More\n\nText.\n')
    );
    const out = checkChangelogFiles(root).join('\n');
    expect(out).toMatch(/long\.md: body is 601 characters/);
    expect(out).toMatch(/heading\.md: .*heading/);
  });

  it('passes the real entries', () => {
    expect(checkChangelogFiles(path.join(import.meta.dirname, '../..'))).toEqual([]);
  });
});

const sample = [
  { id: '2026-11-03-launch', date: '2026-11-03', title: 'Launch', category: 'new', body: 'A.' },
  { id: '2026-11-12-b', date: '2026-11-12', title: 'B', category: 'fixed', body: 'B.' },
  {
    id: '2026-11-12-a',
    date: '2026-11-12',
    title: 'Tags & <filters> "now"',
    category: 'improved',
    docs: '/inbox/sample/',
    body: 'C.',
  },
];

describe('changelog library', () => {
  it('takes the slug after the date', () => {
    expect(slugOf('2026-11-03-looma-is-live')).toBe('looma-is-live');
  });

  it('sorts newest first, then by slug, and groups by date', () => {
    const sorted = sortNewestFirst(sample);
    expect(sorted.map((e) => e.id)).toEqual(['2026-11-12-a', '2026-11-12-b', '2026-11-03-launch']);
    expect(groupByDate(sorted).map((g) => [g.date, g.entries.length])).toEqual([
      ['2026-11-12', 2],
      ['2026-11-03', 1],
    ]);
  });

  it('escapes XML text', () => {
    expect(escapeXml(`Tags & <filters> "now" 'x'`)).toBe(
      'Tags &amp; &lt;filters&gt; &quot;now&quot; &apos;x&apos;'
    );
  });

  it('writes a valid Atom feed of at most 50 entries', () => {
    const xml = atomFeed(
      sample.map((e) => ({ ...e, html: `<p>${e.body}</p>` })),
      'https://docs.getlooma.io'
    );
    expect(valid(xml)).toBe(true);
    expect(xml).toContain('<feed xmlns="http://www.w3.org/2005/Atom">');
    expect(xml).toContain('<id>tag:docs.getlooma.io,2026-11-12:a</id>');
    expect(xml).toContain('href="https://docs.getlooma.io/changelog/#a"');
    expect(xml).toContain('Tags &amp; &lt;filters&gt; &quot;now&quot;');
    expect(xml).toContain('&lt;p&gt;C.&lt;/p&gt;');
    expect(xml).toContain('<updated>2026-11-12T00:00:00Z</updated>');
    const many = Array.from({ length: 60 }, (_, i) => ({
      ...sample[0],
      id: `2026-11-03-e${i}`,
      html: '',
    }));
    expect(
      parse(atomFeed(many, 'https://docs.getlooma.io')).querySelectorAll('entry')
    ).toHaveLength(50);
  });

  it('renders the entries as Markdown', () => {
    const md = changelogMarkdown(sortNewestFirst(sample), 'https://docs.getlooma.io');
    expect(md).toMatch(/^## November 12, 2026\n\n### Tags & <filters> "now"\n\n_Improved_/);
    expect(md).toContain('[Read the docs](https://docs.getlooma.io/inbox/sample/)');
    expect(md).toContain('## November 3, 2026');
  });

  it('replaces the component in the Markdown copy with the entries', () => {
    const md = withChangelog('# Changelog\n\nIntro.\n\n<Changelog />\n', '## November 3, 2026');
    expect(md).toBe(
      '# Changelog\n\nIntro.\n\n[Atom feed](https://docs.getlooma.io/changelog/feed.xml)\n\n## November 3, 2026\n'
    );
  });

  it('reads entry files with their frontmatter and body', () => {
    const root = repo();
    const [e] = readEntries(path.join(root, 'src/content/changelog'));
    expect(e).toMatchObject({
      id: '2026-11-12-sample',
      date: '2026-11-12',
      title: 'Sample change',
      category: 'new',
      body: 'Sample entry text for the test.',
    });
  });

  it('puts the changelog last in the sidebar', () => {
    expect(sections.at(-1)).toEqual({ dir: 'changelog', label: 'Changelog' });
  });
});

describe('changelog built site (check-site)', () => {
  const site = 'https://docs.getlooma.io';
  function built(pageBody, feed) {
    const dist = tempDir();
    write(dist, 'changelog/index.html', `<html><body>${pageBody}</body></html>`);
    if (feed !== undefined) write(dist, 'changelog/feed.xml', feed);
    write(dist, 'changelog.md', '# Changelog\n\n### Launch\n\n### B\n\n### Tags\n');
    write(dist, 'llms-full.txt', '# Changelog\n\n### Launch\n### B\n### Tags\n');
    return dist;
  }
  const entries = sortNewestFirst(sample).map((e) => ({ ...e, title: e.title.slice(0, 4) }));
  const feed = atomFeed(
    entries.map((e) => ({ ...e, html: '' })),
    site
  );
  const page =
    '<link rel="alternate" type="application/atom+xml" href="/changelog/feed.xml">' +
    '<h2 id="2026-11-12">x</h2><h3 id="a">a</h3><h3 id="b">b</h3>' +
    '<h2 id="2026-11-03">y</h2><h3 id="launch">l</h3>';

  it('passes a complete page and feed', () => {
    expect(changelogSiteErrors(built(page, feed), entries, site)).toEqual([]);
  });

  it('flags a missing or duplicated anchor, a missing feed and a missing alternate link', () => {
    const out = changelogSiteErrors(
      built(page.replace('<h3 id="b">b</h3>', '<h3 id="a">a</h3>').replace(/<link[^>]*>/, '')),
      entries,
      site
    ).join('\n');
    expect(out).toMatch(/#a appears 2 times/);
    expect(out).toMatch(/#b appears 0 times/);
    expect(out).toMatch(/feed\.xml missing/);
    expect(out).toMatch(/no Atom alternate link/);
  });

  it('flags dates out of order', () => {
    const swapped =
      '<link rel="alternate" type="application/atom+xml" href="/changelog/feed.xml">' +
      '<h2 id="2026-11-03">y</h2><h3 id="launch">l</h3>' +
      '<h2 id="2026-11-12">x</h2><h3 id="a">a</h3><h3 id="b">b</h3>';
    expect(changelogSiteErrors(built(swapped, feed), entries, site).join('\n')).toMatch(
      /dates are not newest first/
    );
  });

  it('flags a feed that does not list every entry', () => {
    const short = atomFeed(
      entries.slice(0, 2).map((e) => ({ ...e, html: '' })),
      site
    );
    expect(changelogSiteErrors(built(page, short), entries, site).join('\n')).toMatch(
      /feed lists 2 entries, expected 3/
    );
  });

  it('flags a Markdown copy without an entry', () => {
    const dist = built(page, feed);
    fs.writeFileSync(path.join(dist, 'changelog.md'), '# Changelog\n');
    expect(changelogSiteErrors(dist, entries, site).join('\n')).toMatch(/changelog\.md: no "Laun"/);
  });
});
