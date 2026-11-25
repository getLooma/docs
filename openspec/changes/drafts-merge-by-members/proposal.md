## Why

A pull request drafted by automation could not be merged by the person who asked for it: the
`drafted-pr` check required an approving review from someone other than the pull request's
author, and the ruleset has an empty bypass list. When a draft is opened from the owner's own
account (the automatic drafter could not run, so it was drafted by hand), nobody but a second
team member could unblock it. The ruleset already lets any member of the Looma team merge their
own pull request once its checks pass, and only the team can write to the repository.

Approved by the owner (Antoine) in chat on 2026-11-24: "only looma members can merge but anyone
can make a PR".

## What Changes

- `drafted-pr` keeps its two checks: the `drafted` label, and no links to other getLooma
  repositories. It drops the approving-review requirement. Merging, which only `@getLooma/dev`
  and the organization owners can do, is the review.
- The workflow no longer reads reviews and no longer reruns on review events. It needs no
  `pull-requests` permission.
- Unchanged: anyone may open a pull request (from a fork); the ruleset still requires `check`,
  `image`, `dco` and `drafted-pr`, squash merges only, and an empty bypass list; the docs bot can
  still neither approve nor merge.

## Capabilities

### Modified Capabilities

- `docs-contributing`: the ruleset requirement and the drafted pull request requirement.

## Impact

- `scripts/check-drafted-pr.mjs`, `.github/workflows/drafted-pr.yml`,
  `scripts/test/dco-drafted.test.mjs`. No ruleset change.
