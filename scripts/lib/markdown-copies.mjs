// Astro integration: after the build, make every Markdown copy start with the page title as an
// h1 followed by its description (docs-discoverability spec). starlight-page-actions writes the
// copies with the title only.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { markdownOf } from './pages.mjs';

/** Insert `> description` after the leading h1 of a Markdown copy, once. */
export function withDescription(markdown, title, description) {
  const body = markdown.replace(/^\s+/, '');
  const heading = `# ${title}`;
  const rest = body.startsWith(heading) ? body.slice(heading.length) : `\n\n${body}`;
  const quote = `> ${description}`;
  if (rest.replace(/^\s+/, '').startsWith(quote)) return `${heading}${rest}`.trimEnd() + '\n';
  return `${heading}\n\n${quote}\n\n${rest.replace(/^\s+/, '')}`.trimEnd() + '\n';
}

/** @param {{ route: string, title: string, description: string }[]} pages */
export default function markdownCopies(pages) {
  return {
    name: 'looma-markdown-copies',
    hooks: {
      'astro:build:done': ({ dir }) => {
        const out = fileURLToPath(dir);
        for (const page of pages) {
          const file = path.join(out, markdownOf(page.route));
          if (!fs.existsSync(file)) continue; // check-site.mjs reports the missing copy
          const next = withDescription(fs.readFileSync(file, 'utf8'), page.title, page.description);
          fs.writeFileSync(file, next);
        }
      },
    },
  };
}
