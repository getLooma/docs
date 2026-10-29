import { describe, expect, it } from 'vitest';
import { parse } from 'node-html-parser';
import { headingErrors, imageErrors } from '../check-site.mjs';
import { withDescription } from '../lib/markdown-copies.mjs';
import { deploy } from '../coolify-deploy.mjs';

const html = (body) =>
  parse(
    `<html lang="en"><body><h1>Title</h1><main><div class="sl-markdown-content">${body}</div></main></body></html>`
  );

describe('check-site helpers', () => {
  it('flags a second h1 and a skipped level', () => {
    expect(headingErrors(html('<h1>Again</h1>'), '/x/').join()).toMatch(/2 h1 elements/);
    expect(headingErrors(html('<h2>A</h2><h4>B</h4>'), '/x/').join()).toMatch(
      /"B" \(h4\) skips a level/
    );
    expect(headingErrors(html('<h2>A</h2><h3>B</h3><h2>C</h2>'), '/x/')).toEqual([]);
  });

  it('flags an image without alt text unless decorative', () => {
    expect(imageErrors(html('<img src="/a.png" alt="">'), '/x/').join()).toMatch(/no alt text/);
    expect(imageErrors(html('<img src="/a.png">'), '/x/').join()).toMatch(/no alt text/);
    expect(imageErrors(html('<img src="/a.png" alt="" role="presentation">'), '/x/')).toEqual([]);
    expect(imageErrors(html('<img src="/a.png" alt="The inbox">'), '/x/')).toEqual([]);
  });
});

describe('Markdown copies', () => {
  it('adds the description after the title once', () => {
    const once = withDescription('# Title\n\nBody\n', 'Title', 'Desc');
    expect(once).toBe('# Title\n\n> Desc\n\nBody\n');
    expect(withDescription(once, 'Title', 'Desc')).toBe(once);
  });
});

describe('coolify-deploy', () => {
  const env = { url: 'https://coolify.example.com', app: 'app-1', token: 'secret-token' };
  const fake = (statuses) => {
    const calls = [];
    return {
      calls,
      fetchImpl: async (url, init) => {
        calls.push(`${init.method} ${new URL(url).pathname}`);
        if (init.method === 'POST')
          return Response.json({ deployments: [{ deployment_uuid: 'd-1' }] });
        return Response.json({ status: statuses.shift() });
      },
    };
  };

  it('waits for finished', async () => {
    const f = fake(['in_progress', 'finished']);
    await deploy({ ...env, fetchImpl: f.fetchImpl, pollMs: 1, log: () => {} });
    expect(f.calls).toEqual([
      'POST /api/v1/deploy',
      'GET /api/v1/deployments/d-1',
      'GET /api/v1/deployments/d-1',
    ]);
  });

  it('fails on failed, and never echoes the token', async () => {
    const f = fake(['failed']);
    const err = await deploy({ ...env, fetchImpl: f.fetchImpl, pollMs: 1, log: () => {} }).catch(
      (e) => e
    );
    expect(err.message).toMatch(/ended as failed/);
    expect(err.message).not.toContain('secret-token');
  });

  it('refuses to start without its settings', async () => {
    await expect(deploy({ ...env, token: '' })).rejects.toThrow(/COOLIFY_API_TOKEN is not set/);
  });
});
