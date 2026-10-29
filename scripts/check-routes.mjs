#!/usr/bin/env node
// Redirect check for `just check` (docs-discoverability spec, "A removed page leaves a
// permanent redirect"). Every published route is a page or a redirect source; every page is
// published; every redirect lands on a page.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { readPages } from './lib/pages.mjs';
import { readManifest } from './routes.mjs';

export function checkRoutes(root = '.') {
  const errors = [];
  const pages = new Set(readPages(path.join(root, 'src/content/docs')).map((p) => p.route));
  const manifest = readManifest(path.join(root, 'published-routes.txt'));
  const redirects = JSON.parse(fs.readFileSync(path.join(root, 'redirects.json'), 'utf8'));
  const sources = new Map();

  for (const r of redirects) {
    for (const key of ['from', 'to']) {
      if (typeof r[key] !== 'string' || !/^\/([a-z0-9-]+\/)*$/.test(r[key])) {
        errors.push(
          `redirects.json: "${key}" ${JSON.stringify(r[key])} must be a trailing-slash path`
        );
      }
    }
    if (sources.has(r.from)) errors.push(`redirects.json: ${r.from} is redirected twice`);
    sources.set(r.from, r.to);
  }
  for (const [from, to] of sources) {
    if (pages.has(from))
      errors.push(`redirects.json: ${from} is still a page; remove the redirect or the page`);
    if (sources.has(to))
      errors.push(`redirects.json: ${from} → ${to} is a chain; point it at the final page`);
    else if (!pages.has(to)) errors.push(`redirects.json: ${from} → ${to}, which is not a page`);
  }
  for (const route of manifest) {
    if (!pages.has(route) && !sources.has(route)) {
      errors.push(
        `${route} was published and is no longer a page: add a redirect to redirects.json`
      );
    }
  }
  const published = new Set(manifest);
  for (const route of pages) {
    if (!published.has(route))
      errors.push(`${route} is not in published-routes.txt: run \`just routes\``);
  }
  return errors;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const errors = checkRoutes(process.argv[2] ?? '.');
  for (const e of errors) console.error(`check-routes: ${e}`);
  if (errors.length) process.exit(1);
  console.log('check-routes: ok');
}
