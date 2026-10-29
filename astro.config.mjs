// @ts-check
import fs from 'node:fs';
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightLinksValidator from 'starlight-links-validator';
import starlightLlmsTxt from 'starlight-llms-txt';
import starlightPageActions from 'starlight-page-actions';
import { site } from './src/sections.mjs';
import { markdownOf, populatedSections, readPages } from './scripts/lib/pages.mjs';
import markdownCopies from './scripts/lib/markdown-copies.mjs';

// openspec change docs-site: design.md D1 (versions), D3 (IA), D7 (AI), D8 (SEO).
const pages = readPages();
const populated = populatedSections(pages);

/** @type {{ from: string, to: string }[]} */
const redirects = JSON.parse(fs.readFileSync('./redirects.json', 'utf8'));

// starlight-llms-txt's own llms.txt links only the bundles. The `details` block adds the page
// index the spec requires: every page, its Markdown copy and its description, by section.
const entry = (/** @type {(typeof pages)[number]} */ p) =>
  `- [${p.title}](${site}${markdownOf(p.route)}): ${p.description}`;
const pageIndex = [
  '## Pages',
  ...pages.filter((p) => p.section === null).map(entry),
  ...populated.flatMap((s) => [
    `\n### ${s.label}`,
    ...pages.filter((p) => p.section === s.dir).map(entry),
  ]),
].join('\n');

export default defineConfig({
  site,
  trailingSlash: 'always',
  build: { format: 'directory' },
  redirects: Object.fromEntries(redirects.map((r) => [r.from, r.to])),
  integrations: [
    starlight({
      title: 'Looma Docs',
      description:
        'User documentation for Looma, the support platform that turns customer conversations into issues, analysis and suggested replies.',
      logo: { src: './src/assets/logo.svg', alt: 'Looma' },
      favicon: '/favicon.svg',
      defaultLocale: 'root',
      locales: { root: { label: 'English', lang: 'en' } },
      editLink: { baseUrl: 'https://github.com/getLooma/docs/edit/main/' },
      lastUpdated: true,
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/getLooma/docs' }],
      sidebar: populated.map((s) => ({
        label: s.label,
        items: [{ autogenerate: { directory: s.dir } }],
      })),
      components: {
        Head: './src/components/Head.astro',
        Footer: './src/components/Footer.astro',
      },
      plugins: [
        starlightLinksValidator({ errorOnRelativeLinks: false }),
        starlightLlmsTxt({
          projectName: 'Looma',
          description:
            'Looma is a support platform for ecommerce and service teams: it gathers customer conversations from integrations such as Shopify, groups them into issues, analyses them and suggests replies.',
          details: pageIndex,
          customSets: populated.map((s) => ({
            label: s.label,
            description: `the ${s.label} section of the Looma docs`,
            paths: [`${s.dir}/**`],
          })),
        }),
        // No baseUrl: starlight-llms-txt owns every llms*.txt file (design.md D1).
        starlightPageActions({
          prompt: 'Read {url} and answer my questions about Looma using it.',
          actions: { chatgpt: true, claude: true, markdown: true },
        }),
      ],
    }),
    markdownCopies(pages),
  ],
});
