# Looma docs

User documentation for [Looma](https://getlooma.io), published at
[docs.getlooma.io](https://docs.getlooma.io). It is open source: anyone can propose a fix or a new
page, and a member of the Looma team reviews and merges it. See [CONTRIBUTING.md](CONTRIBUTING.md).

The site is built with [Astro Starlight](https://starlight.astro.build). Pages are Markdown files
under [`src/content/docs/`](src/content/docs/).

## Run it locally

With [Nix](https://nixos.org) and [direnv](https://direnv.net) (the setup CI uses):

```sh
direnv allow        # or: nix develop
pnpm install
just dev            # http://localhost:4321
just check          # everything CI checks
```

Without Nix, Node 22 and pnpm 11 are enough to preview a page:

```sh
pnpm install
pnpm dev
```

## Optional support chat

The site can show a support chat button on every page. It is off unless both of these build
settings are set; with neither set, the pages have no chat script and the Content-Security-Policy
allows no other origin.

| Setting                   | Value                                                                  |
| ------------------------- | ---------------------------------------------------------------------- |
| `PUBLIC_SUPPORT_CHAT_URL` | The chat service's origin, such as `https://chat.example.com`, no path |
| `PUBLIC_SUPPORT_CHAT_KEY` | The chat widget's public key (`lpk_` and 26 characters)                |

They are read from the environment when the site is built, not from `.env` files. Setting only
one, or a malformed value, fails the build. When both are set, every page loads
`<PUBLIC_SUPPORT_CHAT_URL>/v1/widget.js` with the key, and the build writes the policy
(`dist/_csp.caddy`, imported by `deploy/Caddyfile`) with the chat origin added to `script-src`
and `frame-src` only. `just check` verifies that the pages and the policy match the settings.

Production builds read them from the repository's Actions variables of the same names (Settings,
Secrets and variables, Actions, Variables), in `deploy.yml`; the key is public, not a secret.
The docs site's origin must also be one of the chat widget's allowed origins. To try it locally:

```sh
PUBLIC_SUPPORT_CHAT_URL=https://chat.example.com PUBLIC_SUPPORT_CHAT_KEY=lpk_… just build
```

## For AI assistants

Every page has a Markdown copy at `<page>.md` (or ask for a page with `Accept: text/markdown`), and
[`/llms.txt`](https://docs.getlooma.io/llms.txt) lists every page with a one-line summary.
[`/llms-full.txt`](https://docs.getlooma.io/llms-full.txt) holds all of them in one file.

## License

- **Documentation text and images** (everything under `src/content/` and `src/assets/`):
  [Creative Commons Attribution 4.0 International](LICENSE-docs) (CC BY 4.0). Attribute "Looma
  docs contributors" with a link to the page.
- **Everything else** (site code, configuration, scripts, workflows, the Vale style): the
  [MIT License](LICENSE).
- The fonts in `src/fonts/` are under the [SIL Open Font License 1.1](src/fonts/OFL.txt).
- The Looma name and logo, and the names and logos of other providers, are trademarks of their
  owners and are not covered by either license.
