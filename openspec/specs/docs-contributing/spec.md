# docs-contributing Specification

## Purpose
TBD - created by archiving change docs-site. Update Purpose after archive.

## Requirements

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

### Requirement: Pull requests follow a template

`.github/PULL_REQUEST_TEMPLATE.md` SHALL ask what changed and why, which pages, whether the
change describes released behaviour, and SHALL carry checkboxes for: style guide followed, `just
check` passed, no internal details, sign-off.

#### Scenario: The template has the checklist

- **WHEN** `just check` runs
- **THEN** it fails if `.github/PULL_REQUEST_TEMPLATE.md` lacks any of the four checklist items

### Requirement: Anyone may contribute, only the Looma team merges

Anyone SHALL be able to open issues, take part in discussions, and open pull requests from a
fork. Only members of the GitHub team `@getLooma/docs-maintainers`, which holds the repository's
write access, SHALL be able to merge; every other account has read access only.
`.github/CODEOWNERS` SHALL assign `*` to `@getLooma/docs-maintainers`, and `/.github/` and
`/scripts/` to the owner. `CONTRIBUTING.md` SHALL state that anyone can propose a change and that
a Looma team member reviews and merges it.

#### Scenario: CODEOWNERS names the team and the owner

- **WHEN** `just check` runs
- **THEN** it fails if `.github/CODEOWNERS` has no `*` rule for `@getLooma/docs-maintainers`, or
  no owner rule for `/.github/` and `/scripts/`

#### Scenario: Only the team has write access

- **WHEN** `just repo-settings check` runs with an admin token
- **THEN** it fails if any team or user other than `@getLooma/docs-maintainers` and the
  organization owners has write, maintain or admin access

### Requirement: The main branch is protected by a ruleset kept as code

`.github/rulesets/main.json` SHALL be the definition of the active ruleset `main` on the default
branch, matching what is applied on GitHub. `just ruleset-apply` SHALL create or update it, and
`just ruleset-check` SHALL compare it with the live ruleset. Both go through `gh api` and need a
login with admin access to the repository.

The ruleset SHALL hold the phase 1 rules:

- deletion blocked;
- no force pushes (`non_fast_forward`);
- a pull request for every change, with 0 required approvals;
- stale reviews dismissed on new pushes;
- review threads resolved before merge;
- extra approval for unattributed changes;
- squash merge as the only merge method;
- an empty bypass list.

Phases 2 and 3 are a documented follow-up (design.md D19), not yet required:

- **Phase 2**, once CI exists: required status checks for `just check`, plus DCO if it is adopted.
- **Phase 3**, once a second team member joins: 1 required approval, code-owner review and
  last-push approval.

#### Scenario: The ruleset file holds the phase 1 rules

- **WHEN** `just check` runs
- **THEN** it fails if `.github/rulesets/main.json` lacks any phase 1 rule or parameter, allows a
  merge method other than squash, or has a non-empty `bypass_actors`

#### Scenario: The live ruleset matches the file

- **WHEN** `just ruleset-check` runs with an admin login
- **THEN** it exits non-zero and prints both versions if the ruleset on GitHub differs from the
  file

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
with `drafts/`, labelled `drafted`, and SHALL pass the same `ci.yml` and the same ruleset as any
other pull request. It is never merged by the bot; a member of `@getLooma/docs-maintainers`
reviews and merges it (by process in phase 1; enforced by the ruleset's approval rule from phase
3, design.md D19). Its body SHALL describe the user-facing change in user terms and SHALL
NOT link to or name a private repository, pull request, issue or person outside the docs repo.
The docs bot SHALL NOT be able to approve or merge, and SHALL NOT be in the ruleset's bypass
list.

#### Scenario: A drafted pull request carries its label

- **WHEN** the `drafted-pr` job (workflow `drafted-pr.yml`) runs on a pull request from a
  `drafts/` branch
- **THEN** it fails if the pull request lacks the `drafted` label or its body contains
  `github.com/getLooma/` links to any repository other than this one
