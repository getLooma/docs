import { describe, expect, it } from 'vitest';
import { checkRoutes } from '../check-routes.mjs';
import { appendRoutes, renderCaddy } from '../routes.mjs';
import { DESC, page, tempDir, write } from './helpers.mjs';

function repo({ manifest, redirects = [] }) {
  const root = tempDir();
  write(root, 'src/content/docs/index.mdx', page('Home', DESC));
  write(root, 'src/content/docs/inbox/assign.md', page('Assign', DESC));
  write(root, 'published-routes.txt', `# header\n${manifest.join('\n')}\n`);
  write(root, 'redirects.json', JSON.stringify(redirects));
  return root;
}

describe('check-routes', () => {
  it('passes when every published route resolves', () => {
    expect(checkRoutes(repo({ manifest: ['/', '/inbox/assign/'] }))).toEqual([]);
  });

  it('fails when a published page disappears without a redirect', () => {
    const errors = checkRoutes(repo({ manifest: ['/', '/inbox/assign/', '/inbox/old/'] }));
    expect(errors.join('\n')).toMatch(/\/inbox\/old\/ was published and is no longer a page/);
  });

  it('passes when the removed page redirects to a page', () => {
    const root = repo({
      manifest: ['/', '/inbox/assign/', '/inbox/old/'],
      redirects: [{ from: '/inbox/old/', to: '/inbox/assign/' }],
    });
    expect(checkRoutes(root)).toEqual([]);
  });

  it('fails on a new page that was not recorded', () => {
    expect(checkRoutes(repo({ manifest: ['/'] })).join('\n')).toMatch(/run `just routes`/);
  });

  it('fails on a redirect to a missing page and on a chain', () => {
    const root = repo({
      manifest: ['/', '/inbox/assign/', '/a/', '/b/'],
      redirects: [
        { from: '/a/', to: '/b/' },
        { from: '/b/', to: '/nowhere/' },
      ],
    });
    const out = checkRoutes(root).join('\n');
    expect(out).toMatch(/\/a\/ → \/b\/ is a chain/);
    expect(out).toMatch(/\/b\/ → \/nowhere\/, which is not a page/);
  });
});

describe('routes', () => {
  it('only ever appends', () => {
    expect(appendRoutes(['/', '/gone/'], ['/', '/new/'])).toEqual(['/', '/gone/', '/new/']);
  });

  it('renders permanent Caddy redirects for both slash forms', () => {
    expect(renderCaddy([{ from: '/old/', to: '/new/' }])).toContain(
      'redir /old/ /new/ permanent\nredir /old /new/ permanent\n'
    );
  });
});
