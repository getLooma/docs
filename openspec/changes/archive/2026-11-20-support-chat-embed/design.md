## Context

The production server is Caddy over the built site (`deploy/Caddyfile`), with a strict
Content-Security-Policy that allows only the site's own scripts. The chat widget is a loader
script from the chat service's origin that opens a frame on that same origin.

## Decisions

### D1. Build settings, both or neither

`PUBLIC_SUPPORT_CHAT_URL` and `PUBLIC_SUPPORT_CHAT_KEY` are read from `process.env` at build time
by one function, `supportChatConfig`, used by the page head, the CSP integration and
`check-site`. Reading `process.env` everywhere (not `import.meta.env`, which also reads `.env`
files) keeps one source, so the tag and the policy cannot disagree. Empty values count as unset,
so an unset Actions variable means off. The URL must be an `https` origin (`http://localhost`
for local trials); the key must match the widget's public key format.

### D2. The policy is a build output

The CSP moves from the Caddyfile to `dist/_csp.caddy`, written by an `astro:build:done` hook and
imported by the Caddyfile like `_redirects.caddy`. A runtime variable on the server would let the
image and the pages drift apart; a build output cannot. The file is public, like the header.

### D3. Only `script-src` and `frame-src`

The loader is a script from the chat origin and draws its button with inline style properties
(allowed by the CSSOM, not governed by `style-src`); the conversation runs inside the frame, on
the chat origin, under that origin's own policy. The docs page itself never connects to the chat
origin, so `connect-src` stays `'self'`.

### D4. Production values are repository variables

`deploy.yml`'s build step maps the Actions variables of the same names. The key is public (it
ships in every page), so it is a variable, not a secret. `ci.yml` stays secret- and
variable-free, and its builds verify the off state.

## Keeping internal details out

No host name is hard-coded: the chat origin is a setting, and examples use `chat.example.com`.
The repository names no organization, account or service internals; the settings are the only
configuration and they belong to this site's build.

## Risks / Trade-offs

- A wrong origin or key breaks only the chat button; the rest of the site is unaffected, and the
  policy never allows more than the configured origin.
- Turning the chat on or off needs a rebuild and deploy, by design (D2).
