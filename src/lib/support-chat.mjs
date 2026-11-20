// The optional support chat embed (openspec change `support-chat-embed`). Off unless both build
// settings are set; then every page loads the chat widget and the Content-Security-Policy allows
// the chat origin, and only then. The build (Head.astro, the CSP integration) and check-site all
// read the settings through supportChatConfig, so the tag and the policy cannot disagree.

export const URL_SETTING = 'PUBLIC_SUPPORT_CHAT_URL';
export const KEY_SETTING = 'PUBLIC_SUPPORT_CHAT_KEY';

/** The widget's public key: `lpk_` and 26 lower-case base32 characters. */
export const KEY_PATTERN = /^lpk_[a-z2-7]{26}$/;

/** The file the build writes next to the site and deploy/Caddyfile imports. */
export const CSP_FILE = '_csp.caddy';

const BASE_POLICY = {
  'default-src': ["'self'"],
  // Starlight ships small inline scripts (theme) and Pagefind needs WebAssembly.
  'script-src': ["'self'", "'unsafe-inline'", "'wasm-unsafe-eval'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:'],
  'font-src': ["'self'"],
  'connect-src': ["'self'"],
  'frame-src': ["'self'"],
  'object-src': ["'none'"],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
};

/**
 * The support chat settings from an environment, or null when both are unset (or empty).
 * Throws when only one is set or either is malformed, so a broken setting fails the build.
 * @param {Record<string, string | undefined>} env
 * @returns {{ origin: string, key: string, scriptUrl: string } | null}
 */
export function supportChatConfig(env) {
  const url = env[URL_SETTING]?.trim() ?? '';
  const key = env[KEY_SETTING]?.trim() ?? '';
  if (!url && !key) return null;
  if (!url || !key) {
    throw new Error(
      `support chat: set both ${URL_SETTING} and ${KEY_SETTING}, or neither (${url ? KEY_SETTING : URL_SETTING} is empty)`
    );
  }
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`support chat: ${URL_SETTING} is not a URL`);
  }
  const local = parsed.protocol === 'http:' && parsed.hostname === 'localhost';
  if (
    (parsed.protocol !== 'https:' && !local) ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash ||
    !['', '/'].includes(parsed.pathname)
  ) {
    throw new Error(
      `support chat: ${URL_SETTING} must be an origin such as https://chat.example.com (no path)`
    );
  }
  if (!KEY_PATTERN.test(key)) {
    throw new Error(
      `support chat: ${KEY_SETTING} must be lpk_ and 26 lower-case base32 characters`
    );
  }
  return { origin: parsed.origin, key, scriptUrl: `${parsed.origin}/v1/widget.js` };
}

/**
 * The site's Content-Security-Policy: the chat origin is added to script-src (the loader) and
 * frame-src (the chat frame) only when the support chat is configured.
 * @param {{ origin: string } | null} config
 */
export function contentSecurityPolicy(config) {
  return Object.entries(BASE_POLICY)
    .map(([directive, sources]) => {
      const extra =
        config && ['script-src', 'frame-src'].includes(directive) ? [config.origin] : [];
      return [directive, ...sources, ...extra].join(' ');
    })
    .join('; ');
}

/** The Caddyfile fragment deploy/Caddyfile imports from the site root. */
export function cspCaddy(config) {
  return `# Written by the build (src/lib/support-chat.mjs); do not edit.\nheader Content-Security-Policy "${contentSecurityPolicy(config)}"\n`;
}
