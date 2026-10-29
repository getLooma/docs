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
