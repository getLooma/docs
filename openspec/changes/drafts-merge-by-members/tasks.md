## 1. Check

- [x] 1.1 Drop the approval requirement from `scripts/check-drafted-pr.mjs`; keep the label and
      private-link checks.
- [x] 1.2 `drafted-pr.yml`: no reviews read, no `pull_request_review` trigger, no
      `pull-requests` permission.
- [x] 1.3 Tests: a labelled, clean draft passes with no review.
- [x] 1.4 `just check` and `openspec validate drafts-merge-by-members --strict` pass.
