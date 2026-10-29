#!/usr/bin/env node
// The `drafted-pr` check (docs-contributing spec, "Drafted pull requests are received like any
// other"; design.md D18 and D19): a pull request from a drafts/ branch is labelled `drafted`,
// links no other getLooma repository, and has an approving review from someone with write
// access. Reads the event payload and the reviews from the environment (GitHub Actions).
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const WRITERS = ['OWNER', 'MEMBER', 'COLLABORATOR'];

/**
 * @param {{ labels: string[], body: string, author: string,
 *           reviews: { state: string, user: string, association: string }[] }} pr
 */
export function draftedErrors(pr) {
  const errors = [];
  if (!pr.labels.includes('drafted')) errors.push('the pull request lacks the "drafted" label');
  const privateLink = /github\.com\/getlooma\/(?!docs(\b|\/|$))[a-z0-9._-]+/i.exec(pr.body ?? '');
  if (privateLink) errors.push(`the body links another getLooma repository (${privateLink[0]})`);
  // Latest review per reviewer decides; the author's own reviews never count.
  const latest = new Map();
  for (const r of pr.reviews) if (r.state !== 'COMMENTED') latest.set(r.user, r);
  const approved = [...latest.values()].some(
    (r) => r.state === 'APPROVED' && r.user !== pr.author && WRITERS.includes(r.association)
  );
  if (!approved) errors.push('no approving review from a docs maintainer yet');
  return errors;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
  const reviews = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const pr = event.pull_request;
  const errors = draftedErrors({
    labels: (pr.labels ?? []).map((l) => l.name),
    body: pr.body ?? '',
    author: pr.user.login,
    reviews: reviews.map((r) => ({
      state: r.state,
      user: r.user?.login,
      association: r.author_association,
    })),
  });
  for (const e of errors) console.error(`drafted-pr: ${e}`);
  if (errors.length) process.exit(1);
  console.log('drafted-pr: ok');
}
