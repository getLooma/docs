## ADDED Requirements

### Requirement: CONTRIBUTING.md explains how to propose an edit

`CONTRIBUTING.md` SHALL explain, for someone outside the team: how to fix a page from the "Edit
this page" link (Starlight's `editLink`, pointing at the file on `main`), how to open an issue for
a missing or wrong page, how to run the site locally (with and without Nix), the licensing split,
the sign-off rule, what a pull request needs before review, and that docs describe only released
behaviour. Every page SHALL render an "Edit this page" link to its source file.

#### Scenario: Edit links point to the source file

- **WHEN** `just check` inspects a built page
- **THEN** it has an edit link to `https://github.com/getLooma/docs/edit/main/src/content/docs/<path>`
  that names an existing file

### Requirement: Contributions are signed off

Every commit in a pull request SHALL carry a `Signed-off-by:` trailer matching its author
(Developer Certificate of Origin 1.1), checked by a `dco` job in `ci.yml`. Commits from the Looma
docs bot and from Dependabot SHALL be exempt. The owner decides between DCO and a CLA before
launch (design.md D5); this requirement is replaced if a CLA is chosen.

#### Scenario: A commit without sign-off fails

- **WHEN** a pull request contains a commit without a `Signed-off-by:` trailer
- **THEN** the `dco` job fails and names the commit

### Requirement: Pull requests follow a template and are reviewed

`.github/PULL_REQUEST_TEMPLATE.md` SHALL ask what changed and why, which pages, whether the
change describes released behaviour, and SHALL carry checkboxes for: style guide followed, `just
check` passed, no internal details, sign-off. `.github/CODEOWNERS` SHALL assign every path to the
docs maintainers team, and `.github/` and the `scripts/` checks to the owners. `main` SHALL require
one approving review from a code owner, a passing `ci.yml`, and a linear history; nobody, including
the docs bot, merges without that review.

#### Scenario: The template has the checklist

- **WHEN** `just check` runs
- **THEN** it fails if `.github/PULL_REQUEST_TEMPLATE.md` lacks any of the four checklist items

#### Scenario: CODEOWNERS covers every path

- **WHEN** `just check` runs
- **THEN** it fails if `.github/CODEOWNERS` has no `*` rule or no rule for `/.github/` and `/scripts/`

### Requirement: Issue forms cover the common reports

`.github/ISSUE_TEMPLATE/` SHALL hold forms for a docs error (page URL, what is wrong), a missing
page (what the reader tried to do) and a product question that redirects to support, and a
`config.yml` that disables blank issues and links security reports to `SECURITY.md`.

#### Scenario: Blank issues are disabled

- **WHEN** `just check` parses `.github/ISSUE_TEMPLATE/config.yml`
- **THEN** `blank_issues_enabled` is `false`

### Requirement: A style guide governs user-facing writing

`STYLE_GUIDE.md` SHALL define: the audience (support agents and admins at Looma customers, not
developers); voice (second person, present tense, active, plain words); answer-first openings
(the first paragraph answers the page's question in at most two sentences); page types (task,
concept, reference, troubleshooting) and their structure; headings (sentence case, no skipped
levels, no `h1` in the body); UI terms written exactly as the product shows them, in bold; the
product vocabulary; links, lists, tables, code blocks with a language; images (alt text that says
what the image shows, no customer data in screenshots, invented sample data only); and what never
goes in public docs. Vale SHALL enforce the product vocabulary from a style vendored in
`styles/Looma/`.

#### Scenario: A banned synonym fails the prose lint

- **WHEN** a page calls an issue a "ticket cluster"
- **THEN** `just check` fails with a Vale error suggesting "issue"

### Requirement: Drafted pull requests are received like any other

A pull request drafted by automation SHALL come from the Looma docs bot on a branch starting
with `drafts/`, labelled `drafted`, and SHALL pass the same `ci.yml` and the same review rule as
any other pull request. Its body SHALL describe the user-facing change in user terms and SHALL
NOT link to or name a private repository, pull request, issue or person outside the docs repo.
The docs bot SHALL NOT be able to approve or merge.

#### Scenario: A drafted pull request carries its label

- **WHEN** the `drafted-pr` job in `ci.yml` runs on a pull request from a `drafts/` branch
- **THEN** it fails if the pull request lacks the `drafted` label or its body contains
  `github.com/getLooma/` links to any repository other than this one
