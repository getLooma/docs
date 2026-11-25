#!/usr/bin/env node
// The `drafted-pr` check (docs-contributing spec, "Drafted pull requests are received like any
// other"; design.md D18, change drafts-merge-by-members): a pull request from a drafts/ branch is
// labelled `drafted` and links no other getLooma repository. It needs no approval: like any pull
// request, only a member of the Looma team can merge it, and merging is the review. Reads the
// event payload from the environment (GitHub Actions).
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

/** @param {{ labels: string[], body: string }} pr */
export function draftedErrors(pr) {
  const errors = [];
  if (!pr.labels.includes('drafted')) errors.push('the pull request lacks the "drafted" label');
  const privateLink = /github\.com\/getlooma\/(?!docs(\b|\/|$))[a-z0-9._-]+/i.exec(pr.body ?? '');
  if (privateLink) errors.push(`the body links another getLooma repository (${privateLink[0]})`);
  return errors;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
  const pr = event.pull_request;
  const errors = draftedErrors({
    labels: (pr.labels ?? []).map((l) => l.name),
    body: pr.body ?? '',
  });
  for (const e of errors) console.error(`drafted-pr: ${e}`);
  if (errors.length) process.exit(1);
  console.log('drafted-pr: ok');
}
