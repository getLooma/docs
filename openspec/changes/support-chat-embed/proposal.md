## Why

The docs site has no way for a reader to ask for help from the page they are reading. A chat
widget can run on any site with one script tag. This change lets the site carry that tag, off by
default and turned on by build settings, without loosening the site's Content-Security-Policy
while it is off.

## What Changes

- **Two build settings**, `PUBLIC_SUPPORT_CHAT_URL` (the chat service's origin) and
  `PUBLIC_SUPPORT_CHAT_KEY` (the widget's public key), read from the environment by
  `src/lib/support-chat.mjs`. Both unset: off. One alone or a malformed value fails the build.
- **The tag.** `src/components/Head.astro` renders
  `<script src="<origin>/v1/widget.js" data-key="<key>" async>` on every page when configured,
  and nothing otherwise.
- **The policy moves into the build.** A new integration, `scripts/lib/support-chat-csp.mjs`
  (wired in `astro.config.mjs`), writes `dist/_csp.caddy`; `deploy/Caddyfile` imports it instead
  of its inline `Content-Security-Policy`. Unconfigured, the policy is today's (plus an explicit
  `frame-src 'self'`, which `default-src` already implied); configured, the chat origin is added
  to `script-src` and `frame-src` only.
- **Checks.** `scripts/check-site.mjs` fails when a page has a chat tag the settings do not ask
  for, when a configured build misses or changes it, or when `_csp.caddy` differs from the
  settings; `scripts/smoke` checks the served policy is the built one. Tests in
  `scripts/test/support-chat.test.mjs`.
- **Production.** `.github/workflows/deploy.yml` passes the repository's Actions variables of the
  same names to the build. `ci.yml` does not, so pull request builds stay off.
- **README.md** documents the settings.

## Non-goals

- Any page, changelog entry or text about the chat: the button is the widget's own.
- A runtime switch: the settings are fixed per build, so the tag and the policy always agree.
- Changes to the widget itself or to which sites may embed it (configured on the chat side).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `docs-delivery`: the safe-headers requirement allows the chat origin only when configured, and
  a new requirement covers the optional embed.

## Impact

`astro.config.mjs`, `src/components/Head.astro`, `src/lib/support-chat.mjs`,
`scripts/lib/support-chat-csp.mjs`, `scripts/check-site.mjs`, `scripts/smoke`,
`scripts/test/support-chat.test.mjs`, `deploy/Caddyfile`, `.github/workflows/deploy.yml`,
`README.md`. No new dependency. No page changes.
