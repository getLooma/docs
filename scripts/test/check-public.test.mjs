import { describe, expect, it } from 'vitest';
import { checkPublic, scanText } from '../check-public.mjs';
import { tempDir, write } from './helpers.mjs';

// Fixtures are assembled at run time so this file itself passes the scan.
const org = 'github.com/getLooma/';
const fixtures = {
  privateAddress: 'http://10.0.' + '3.7:8080/healthz',
  localPort: 'localhost:' + '5173',
  internalHost: 'db.prod.' + 'internal',
  privateImage: 'ghcr.io/getlooma/' + 'core:latest',
  privateRepo: `https://${org}${'core'}/pull/12`,
  envVar: 'SHOPIFY_' + 'CLIENT_SECRET',
};

describe('check-public', () => {
  for (const [name, text] of Object.entries(fixtures)) {
    it(`flags ${name} in a page`, () => {
      expect(scanText('src/content/docs/faq/x.md', `See ${text} here.`, [])).not.toEqual([]);
    });
  }

  it('flags env var names only in pages', () => {
    expect(scanText('.github/workflows/ci.yml', fixtures.envVar, [])).toEqual([]);
  });

  it('allows a link to this repository and the public image', () => {
    expect(
      scanText('README.md', `https://${org}docs/edit/main and ghcr.io/getlooma/docs:live`, [])
    ).toEqual([]);
  });

  it('accepts an exact allowlisted match', () => {
    expect(scanText('a.md', fixtures.internalHost, [fixtures.internalHost])).toEqual([]);
  });

  it('names the file and line', () => {
    const root = tempDir();
    write(root, 'src/content/docs/faq/x.md', `one\n${fixtures.privateAddress}\n`);
    expect(checkPublic(root, ['src/content/docs/faq/x.md'])[0]).toMatch(
      /^src\/content\/docs\/faq\/x\.md:2: private network address/
    );
  });
});
