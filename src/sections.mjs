// The information architecture (openspec change docs-site, design.md D3). One entry per
// top-level directory under src/content/docs/. A section is shown in the sidebar and gets an
// llms.txt bundle only once it holds a page. Order here is sidebar order.
export const sections = [
  { dir: 'getting-started', label: 'Getting started' },
  { dir: 'inbox', label: 'Inbox and conversations' },
  { dir: 'issues', label: 'Issues' },
  { dir: 'ai', label: 'AI replies and analysis' },
  { dir: 'integrations', label: 'Integrations' },
  { dir: 'team', label: 'Team and roles' },
  { dir: 'privacy', label: 'Privacy and data requests' },
  { dir: 'faq', label: 'FAQ' },
];

export const site = 'https://docs.getlooma.io';
export const contentDir = 'src/content/docs';
