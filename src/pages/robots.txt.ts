import type { APIRoute } from 'astro';

// Allow every crawler, and name the AI and search crawlers explicitly (owner decision: be
// cited). openspec change docs-site, docs-discoverability spec.
export const crawlers = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-User',
  'Claude-SearchBot',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Googlebot',
  'Applebot',
  'Applebot-Extended',
  'CCBot',
  'Bingbot',
  'DuckAssistBot',
  'Meta-ExternalAgent',
  'MistralAI-User',
  'Amazonbot',
];

export const GET: APIRoute = ({ site }) => {
  const origin = site ?? new URL('https://docs.getlooma.io');
  const groups = crawlers.map((agent) => `User-agent: ${agent}\nAllow: /`).join('\n\n');
  const body = [
    '# Looma docs: every crawler is welcome.',
    `# A page index for language models: ${new URL('/llms.txt', origin).href}`,
    `# Every page is also available as Markdown at <page>.md, or with Accept: text/markdown.`,
    '',
    'User-agent: *',
    'Allow: /',
    '',
    groups,
    '',
    `Sitemap: ${new URL('/sitemap-index.xml', origin).href}`,
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
