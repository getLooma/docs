#!/usr/bin/env node
// Built-site checks for `just check` (openspec change docs-site, docs-discoverability spec):
// semantic HTML, metadata, JSON-LD, Markdown copies, llms.txt, sitemap, robots.txt, edit links
// and the client JavaScript budget. Usage: check-site.mjs [dist] [root]
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse as parseHtml } from 'node-html-parser';
import { site as defaultSite } from '../src/sections.mjs';
import { frontmatter, markdownOf, readPages } from './lib/pages.mjs';

export const REQUIRED_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-User',
  'Claude-SearchBot',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
  'CCBot',
  'Bingbot',
];

const htmlFile = (dist, route) => path.join(dist, route, 'index.html');

/** Heading levels must never skip (h2 → h4); the page title is the only h1. */
export function headingErrors(root, route) {
  const errors = [];
  const h1 = root.querySelectorAll('h1');
  if (h1.length !== 1) errors.push(`${route}: ${h1.length} h1 elements, expected exactly 1`);
  const content = root.querySelector('.sl-markdown-content');
  let previous = 1;
  for (const h of content?.querySelectorAll('h2, h3, h4, h5, h6') ?? []) {
    const level = Number(h.tagName.slice(1));
    if (level > previous + 1) {
      errors.push(
        `${route}: heading "${h.text.trim()}" (h${level}) skips a level after h${previous}`
      );
    }
    previous = level;
  }
  return errors;
}

export function imageErrors(root, route) {
  const errors = [];
  const content = root.querySelector('main');
  for (const img of content?.querySelectorAll('img') ?? []) {
    const alt = img.getAttribute('alt');
    const decorative = img.getAttribute('role') === 'presentation';
    if (alt === undefined || (alt.trim() === '' && !decorative)) {
      errors.push(`${route}: image ${img.getAttribute('src')} has no alt text`);
    }
  }
  return errors;
}

function metaContent(root, attr, name) {
  return root.querySelector(`meta[${attr}="${name}"]`)?.getAttribute('content');
}

function jsonLdErrors(root, route, page, siteUrl, source) {
  const errors = [];
  const graph = [];
  for (const s of root.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      const data = JSON.parse(s.text);
      graph.push(...(data['@graph'] ?? [data]));
    } catch {
      errors.push(`${route}: JSON-LD block does not parse`);
    }
  }
  const byType = (t) => graph.find((n) => n['@type'] === t);
  if (!byType('Organization')) errors.push(`${route}: JSON-LD has no Organization`);
  const crumbs = byType('BreadcrumbList');
  const segments = route.split('/').filter(Boolean);
  if (!crumbs) errors.push(`${route}: JSON-LD has no BreadcrumbList`);
  else {
    const items = crumbs.itemListElement ?? [];
    if (items.length !== segments.length + 1) {
      errors.push(
        `${route}: BreadcrumbList has ${items.length} items, expected ${segments.length + 1}`
      );
    }
    const last = items.at(-1)?.item;
    if (last !== new URL(route, siteUrl).href) {
      errors.push(`${route}: BreadcrumbList ends at ${last}, expected the page URL`);
    }
  }
  if (route !== '/') {
    const article = byType('TechArticle');
    if (!article) errors.push(`${route}: JSON-LD has no TechArticle`);
    else if (article.headline !== page.title) {
      errors.push(`${route}: TechArticle headline "${article.headline}" differs from the title`);
    }
  }
  const faq = frontmatter(source).faq;
  if (Array.isArray(faq) && faq.length) {
    const node = byType('FAQPage');
    const questions = (node?.mainEntity ?? []).map((q) => q.name);
    if (JSON.stringify(questions) !== JSON.stringify(faq.map((f) => f.question))) {
      errors.push(`${route}: FAQPage questions do not match the faq frontmatter`);
    }
  }
  return errors;
}

function scriptBytes(root, dist) {
  let total = 0;
  for (const s of root.querySelectorAll('script')) {
    const type = s.getAttribute('type');
    if (type === 'application/ld+json') continue;
    const src = s.getAttribute('src');
    if (src) {
      const file = path.join(dist, src.split('?')[0]);
      if (fs.existsSync(file)) total += fs.statSync(file).size;
    } else total += Buffer.byteLength(s.text);
  }
  return total;
}

function sitemapLocs(dist) {
  const index = path.join(dist, 'sitemap-index.xml');
  if (!fs.existsSync(index)) return null;
  const locs = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  return locs(fs.readFileSync(index, 'utf8')).flatMap((url) => {
    const file = path.join(dist, new URL(url).pathname);
    return fs.existsSync(file) ? locs(fs.readFileSync(file, 'utf8')) : [];
  });
}

export function checkSite({ dist, root = '.', site = defaultSite }) {
  const errors = [];
  const contentDir = path.join(root, 'src/content/docs');
  const pages = readPages(contentDir);
  const redirects = JSON.parse(fs.readFileSync(path.join(root, 'redirects.json'), 'utf8'));
  const budgetFile = path.join(root, 'scripts/budget.json');
  const budget = fs.existsSync(budgetFile) ? JSON.parse(fs.readFileSync(budgetFile, 'utf8')) : null;
  const titles = new Map();
  const descriptions = new Map();

  if (!pages.length) errors.push('no pages under src/content/docs');

  for (const page of pages) {
    const { route } = page;
    const file = htmlFile(dist, route);
    if (!fs.existsSync(file)) {
      errors.push(`${route}: not built (${path.relative(dist, file)} missing)`);
      continue;
    }
    const source = fs.readFileSync(path.join(contentDir, page.file), 'utf8');
    const html = parseHtml(fs.readFileSync(file, 'utf8'));
    const pageUrl = new URL(route, site).href;

    errors.push(...headingErrors(html, route), ...imageErrors(html, route));

    for (const [map, value, what] of [
      [titles, page.title, 'title'],
      [descriptions, page.description, 'description'],
    ]) {
      if (!value) errors.push(`${route}: no ${what} in frontmatter`);
      else if (map.has(value)) errors.push(`${route}: same ${what} as ${map.get(value)}`);
      else map.set(value, route);
    }
    if (page.description && (page.description.length < 50 || page.description.length > 160)) {
      errors.push(
        `${route}: description is ${page.description.length} characters, expected 50 to 160`
      );
    }
    if (metaContent(html, 'name', 'description') !== page.description) {
      errors.push(`${route}: <meta name="description"> differs from the frontmatter description`);
    }
    if (html.querySelector('html')?.getAttribute('lang') !== 'en')
      errors.push(`${route}: <html lang> is not "en"`);
    const canonical = html.querySelector('link[rel="canonical"]')?.getAttribute('href');
    if (canonical !== pageUrl)
      errors.push(`${route}: canonical is ${canonical}, expected ${pageUrl}`);

    for (const prop of [
      'og:title',
      'og:description',
      'og:url',
      'og:type',
      'og:image',
      'og:site_name',
    ]) {
      if (!metaContent(html, 'property', prop)) errors.push(`${route}: missing ${prop}`);
    }
    if (metaContent(html, 'name', 'twitter:card') !== 'summary_large_image') {
      errors.push(`${route}: twitter:card is not summary_large_image`);
    }
    const ogImage = metaContent(html, 'property', 'og:image');
    if (ogImage && !fs.existsSync(path.join(dist, new URL(ogImage).pathname))) {
      errors.push(`${route}: og:image ${ogImage} is not in the build`);
    }

    errors.push(...jsonLdErrors(html, route, page, site, source));

    const md = markdownOf(route);
    const alternate = html
      .querySelector('link[rel="alternate"][type="text/markdown"]')
      ?.getAttribute('href');
    if (alternate !== md)
      errors.push(`${route}: alternate Markdown link is ${alternate}, expected ${md}`);
    const mdFile = path.join(dist, md);
    if (!fs.existsSync(mdFile)) errors.push(`${route}: Markdown copy ${md} missing`);
    else {
      const text = fs.readFileSync(mdFile, 'utf8');
      if (!text.startsWith(`# ${page.title}\n\n> ${page.description}\n`)) {
        errors.push(`${route}: ${md} must start with the title as h1 and the description`);
      }
      if (text.startsWith('---') || /^import\s/m.test(text)) {
        errors.push(`${route}: ${md} contains frontmatter or import lines`);
      }
    }

    const edit = `https://github.com/getLooma/docs/edit/main/src/content/docs/${page.file}`;
    if (!html.querySelector(`a[href="${edit}"]`)) errors.push(`${route}: no edit link to ${edit}`);

    if (budget) {
      const bytes = scriptBytes(html, dist);
      if (bytes > budget.maxScriptBytes) {
        errors.push(`${route}: ${bytes} bytes of client script, budget ${budget.maxScriptBytes}`);
      }
    }
  }
  if (!budget) errors.push('scripts/budget.json missing');

  // llms.txt and llms-full.txt
  const llms = path.join(dist, 'llms.txt');
  const full = path.join(dist, 'llms-full.txt');
  if (!fs.existsSync(llms) || !fs.readFileSync(llms, 'utf8').trim())
    errors.push('llms.txt missing or empty');
  else {
    const text = fs.readFileSync(llms, 'utf8');
    for (const p of pages) {
      const url = new URL(markdownOf(p.route), site).href;
      if (!text.includes(`](${url}): ${p.description}`))
        errors.push(`llms.txt: no entry for ${p.route}`);
    }
  }
  if (!fs.existsSync(full) || !fs.readFileSync(full, 'utf8').trim())
    errors.push('llms-full.txt missing or empty');
  else {
    const text = fs.readFileSync(full, 'utf8');
    for (const p of pages)
      if (!text.includes(`# ${p.title}`)) errors.push(`llms-full.txt: no "${p.title}"`);
  }

  // Sitemap: every page, no redirect source.
  const locs = sitemapLocs(dist);
  if (!locs || !locs.length) errors.push('sitemap-index.xml missing or empty');
  else {
    for (const p of pages) {
      if (!locs.includes(new URL(p.route, site).href)) errors.push(`sitemap: ${p.route} missing`);
    }
    for (const r of redirects) {
      if (locs.includes(new URL(r.from, site).href))
        errors.push(`sitemap: lists redirect source ${r.from}`);
    }
  }

  // robots.txt
  const robotsFile = path.join(dist, 'robots.txt');
  if (!fs.existsSync(robotsFile)) errors.push('robots.txt missing');
  else {
    const robots = fs.readFileSync(robotsFile, 'utf8');
    for (const agent of REQUIRED_CRAWLERS) {
      if (!new RegExp(`User-agent: ${agent}\\nAllow: /\\n`).test(robots)) {
        errors.push(`robots.txt: no "Allow: /" group for ${agent}`);
      }
    }
    if (/^Disallow: \/\s*$/m.test(robots)) errors.push('robots.txt: contains "Disallow: /"');
    if (!robots.includes(`Sitemap: ${new URL('/sitemap-index.xml', site).href}`)) {
      errors.push('robots.txt: no Sitemap line');
    }
    if (!robots.includes('/llms.txt')) errors.push('robots.txt: does not point to /llms.txt');
  }
  return errors;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const errors = checkSite({ dist: process.argv[2] ?? 'dist', root: process.argv[3] ?? '.' });
  for (const e of errors) console.error(`check-site: ${e}`);
  if (errors.length) process.exit(1);
  console.log('check-site: ok');
}
