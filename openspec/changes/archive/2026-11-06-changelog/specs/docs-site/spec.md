## MODIFIED Requirements

### Requirement: Pages follow the information architecture

Every page SHALL live under one of the top-level section directories `getting-started/`,
`inbox/`, `issues/`, `ai/`, `integrations/`, `team/`, `privacy/`, `faq/` or `changelog/` in
`src/content/docs/`, except the home page `index.mdx`. Integration pages SHALL live one directory
per provider under `integrations/` (for example `integrations/shopify/`). A section SHALL appear in
the sidebar only once it holds at least one page.

#### Scenario: A page in an unknown section fails the check

- **WHEN** a page is added at `src/content/docs/billing/plans.md`
- **THEN** `just check` fails, naming the page and the allowed section directories

#### Scenario: An empty section is not in the sidebar

- **WHEN** the site is built and `src/content/docs/team/` holds no page
- **THEN** no sidebar group for Team and roles is rendered

#### Scenario: The changelog is the last section

- **WHEN** the site is built with `src/content/docs/changelog/index.mdx`
- **THEN** the sidebar's last group is Changelog
