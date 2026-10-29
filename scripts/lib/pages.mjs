// Reads the docs pages straight from src/content/docs (frontmatter only), for the config and the
// check scripts. Astro's content layer is not available at config time.
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';
import { contentDir, sections } from '../../src/sections.mjs';

/** Every .md/.mdx file under dir, as paths relative to dir, sorted. */
export function listPageFiles(dir = contentDir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  const walk = (rel) => {
    for (const entry of fs.readdirSync(path.join(dir, rel), { withFileTypes: true })) {
      const next = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) walk(next);
      else if (/\.mdx?$/.test(entry.name)) out.push(next);
    }
  };
  walk('');
  return out.sort();
}

/** The frontmatter of a Markdown file, or {} when it has none. */
export function frontmatter(source) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(source);
  return match ? (parse(match[1]) ?? {}) : {};
}

/** The route of a page file: `inbox/assign.md` → `/inbox/assign/`, `index.mdx` → `/`. */
export function routeOf(file) {
  const noExt = file.replace(/\.mdx?$/, '');
  const trimmed = noExt === 'index' ? '' : noExt.replace(/\/index$/, '');
  return trimmed ? `/${trimmed}/` : '/';
}

/** The Markdown copy of a route: `/inbox/assign/` → `/inbox/assign.md`, `/` → `/index.md`. */
export function markdownOf(route) {
  return route === '/' ? '/index.md' : `${route.replace(/\/$/, '')}.md`;
}

/** Every page with its route, section, title and description. */
export function readPages(dir = contentDir) {
  return listPageFiles(dir).map((file) => {
    const data = frontmatter(fs.readFileSync(path.join(dir, file), 'utf8'));
    const route = routeOf(file);
    const section = file.includes('/') ? file.split('/')[0] : null;
    return { file, route, section, title: data.title, description: data.description };
  });
}

/** The sections that hold at least one page, in sidebar order. */
export function populatedSections(pages) {
  return sections.filter((s) => pages.some((p) => p.section === s.dir));
}
