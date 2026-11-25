## MODIFIED Requirements

### Requirement: The main branch is protected by a ruleset kept as code

`.github/rulesets/main.json` SHALL be the definition of the active ruleset `main` on the default
branch, matching what is applied on GitHub. `just ruleset-apply` SHALL create or update it, and
`just ruleset-check` SHALL compare it with the live ruleset. Both go through `gh api` and need a
login with admin access to the repository.

The ruleset SHALL hold these rules:

- deletion blocked;
- no force pushes (`non_fast_forward`);
- a pull request for every change, with 0 required approvals;
- stale reviews dismissed on new pushes;
- review threads resolved before merge;
- extra approval for unattributed changes;
- squash merge as the only merge method;
- required status checks `check`, `image`, `dco` and `drafted-pr` (GitHub Actions), with the
  branch up to date before merge;
- an empty bypass list.

The ruleset SHALL NOT require approvals from another person. Who may merge is decided by access
alone: only `@getLooma/dev` and the organization owners can write to the repository, so only they
can merge, and any of them may merge their own pull request once its checks pass. Pull requests from docs bot
`drafts/` branches follow the same rule: merging one is its review, and `drafted-pr` requires no
approval.

#### Scenario: The ruleset file holds the phase 1 rules

- **WHEN** `just check` runs
- **THEN** it fails if `.github/rulesets/main.json` lacks any phase 1 rule or parameter, allows a
  merge method other than squash, or has a non-empty `bypass_actors`

#### Scenario: The live ruleset matches the file

- **WHEN** `just ruleset-check` runs with an admin login
- **THEN** it exits non-zero and prints both versions if the ruleset on GitHub differs from the
  file

### Requirement: Drafted pull requests are received like any other

A pull request drafted by automation SHALL come from the Looma docs bot on a branch starting
with `drafts/`, labelled `drafted`, and SHALL pass the same `ci.yml` and the same ruleset as any
other pull request. It is never merged by the bot; a member of `@getLooma/dev`
or an organization owner reviews and merges it, and merging is the review: no separate approval is
required, because only they can merge. Its body SHALL describe the user-facing change in user terms and SHALL
NOT link to or name a private repository, pull request, issue or person outside the docs repo.
The docs bot SHALL NOT be able to approve or merge, and SHALL NOT be in the ruleset's bypass
list.

#### Scenario: A drafted pull request carries its label

- **WHEN** the `drafted-pr` job (workflow `drafted-pr.yml`) runs on a pull request from a
  `drafts/` branch
- **THEN** it fails if the pull request lacks the `drafted` label or its body contains
  `github.com/getLooma/` links to any repository other than this one

#### Scenario: A drafted pull request needs no approval

- **WHEN** the `drafted-pr` job runs on a labelled `drafts/` pull request whose body links no other
  getLooma repository, and nobody has reviewed it
- **THEN** it passes, and only someone with write access can merge the pull request
