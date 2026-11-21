## 1. Settings and policy

- [x] 1.1 Tests first (`scripts/test/support-chat.test.mjs`) for `supportChatConfig` and
      `contentSecurityPolicy`, then `src/lib/support-chat.mjs`. Verify: `just test`.
- [x] 1.2 The CSP integration (`scripts/lib/support-chat-csp.mjs`, `astro.config.mjs`) and the
      Caddyfile import. Verify: `dist/_csp.caddy` after `just build`; `scripts/smoke --local dist`.

## 2. Tag and checks

- [x] 2.1 The tag in `src/components/Head.astro`. Verify: a build with both settings has it on
      every page, a build without has none.
- [x] 2.2 Tests first for `supportChatErrors`, then the check in `scripts/check-site.mjs` and the
      served-policy check in `scripts/smoke`. Verify: `check-site` fails a configured build checked
      without the settings.

## 3. Delivery and docs

- [x] 3.1 `deploy.yml` passes the Actions variables to the build; `README.md` documents them.
      Verify: `actionlint`, `node scripts/check-workflows.mjs`.
- [x] 3.2 `just check`.
