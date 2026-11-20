import { describe, expect, it } from 'vitest';
import { supportChatErrors } from '../check-site.mjs';
import {
  CSP_FILE,
  contentSecurityPolicy,
  cspCaddy,
  supportChatConfig,
} from '../../src/lib/support-chat.mjs';
import { tempDir, write } from './helpers.mjs';

const KEY = 'lpk_abcdefghijklmnopqrstuvwxyz';
const env = { PUBLIC_SUPPORT_CHAT_URL: 'https://chat.example.com', PUBLIC_SUPPORT_CHAT_KEY: KEY };
const config = supportChatConfig(env);

describe('supportChatConfig', () => {
  it('is off when both settings are unset or empty', () => {
    expect(supportChatConfig({})).toBeNull();
    expect(supportChatConfig({ PUBLIC_SUPPORT_CHAT_URL: '', PUBLIC_SUPPORT_CHAT_KEY: ' ' })).toBe(
      null
    );
  });

  it('reads the origin, the key and the script URL', () => {
    expect(config).toEqual({
      origin: 'https://chat.example.com',
      key: KEY,
      scriptUrl: 'https://chat.example.com/v1/widget.js',
    });
    expect(
      supportChatConfig({ ...env, PUBLIC_SUPPORT_CHAT_URL: 'https://chat.example.com/' })
    ).toEqual(config);
  });

  it('fails the build on one setting alone or a malformed one', () => {
    expect(() => supportChatConfig({ PUBLIC_SUPPORT_CHAT_KEY: KEY })).toThrow(/both/);
    expect(() =>
      supportChatConfig({ PUBLIC_SUPPORT_CHAT_URL: env.PUBLIC_SUPPORT_CHAT_URL })
    ).toThrow(/both/);
    for (const url of [
      'chat.example.com',
      'http://chat.example.com',
      'https://chat.example.com/v1',
    ]) {
      expect(() => supportChatConfig({ ...env, PUBLIC_SUPPORT_CHAT_URL: url })).toThrow(/URL/);
    }
    for (const key of ['lpk_short', 'LPK_ABCDEFGHIJKLMNOPQRSTUVWXYZ', `${KEY}"`]) {
      expect(() => supportChatConfig({ ...env, PUBLIC_SUPPORT_CHAT_KEY: key })).toThrow(/KEY/);
    }
  });
});

describe('contentSecurityPolicy', () => {
  it('names no other origin when the support chat is off', () => {
    const csp = contentSecurityPolicy(null);
    expect(csp).toContain("script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval';");
    expect(csp).not.toMatch(/https?:/);
  });

  it('allows the chat origin for scripts and frames only', () => {
    const csp = contentSecurityPolicy(config);
    const sources = Object.fromEntries(
      csp.split('; ').map((d) => [d.split(' ')[0], d.split(' ').slice(1)])
    );
    expect(sources['script-src']).toContain('https://chat.example.com');
    expect(sources['frame-src']).toContain('https://chat.example.com');
    const others = Object.entries(sources).filter(
      ([d]) => !['script-src', 'frame-src'].includes(d)
    );
    expect(others.flatMap(([, s]) => s)).not.toContain('https://chat.example.com');
  });
});

describe('supportChatErrors', () => {
  const tag = `<script src="https://chat.example.com/v1/widget.js" data-key="${KEY}" async></script>`;
  const site = (head, csp) => {
    const dist = tempDir();
    write(dist, 'index.html', `<html><head>${head}</head><body></body></html>`);
    write(dist, '404.html', `<html><head>${head}</head><body></body></html>`);
    write(dist, CSP_FILE, csp);
    return dist;
  };

  it('passes with no tag when off, and with one tag per page when configured', () => {
    expect(supportChatErrors(site('', cspCaddy(null)), ['/'], null)).toEqual([]);
    expect(supportChatErrors(site(tag, cspCaddy(config)), ['/'], config)).toEqual([]);
  });

  it('flags a tag the configuration does not ask for', () => {
    expect(supportChatErrors(site(tag, cspCaddy(null)), ['/'], null).join()).toMatch(
      /not configured/
    );
  });

  it('flags a missing, doubled or different tag when configured', () => {
    expect(supportChatErrors(site('', cspCaddy(config)), ['/'], config).join()).toMatch(
      /0 support chat tags/
    );
    expect(supportChatErrors(site(tag + tag, cspCaddy(config)), ['/'], config).join()).toMatch(
      /2 support chat tags/
    );
    const other = tag.replace(KEY, 'lpk_zzzzzzzzzzzzzzzzzzzzzzzzzz');
    expect(supportChatErrors(site(other, cspCaddy(config)), ['/'], config).join()).toMatch(
      /differs from the configuration/
    );
  });

  it('flags a policy that does not match the configuration', () => {
    expect(supportChatErrors(site('', cspCaddy(config)), ['/'], null).join()).toMatch(
      /_csp.caddy: differs/
    );
    expect(supportChatErrors(site(tag, cspCaddy(null)), ['/'], config).join()).toMatch(
      /_csp.caddy: differs/
    );
  });
});
