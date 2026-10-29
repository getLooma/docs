#!/usr/bin/env node
// DCO check for the `dco` job in ci.yml (docs-contributing spec, "Contributions are signed
// off"): every commit in base..head carries a Signed-off-by trailer matching its author, except
// commits from Dependabot. Usage: check-dco.mjs <base> <head>
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const EXEMPT = [
  /^dependabot\[bot\]$/,
  /^49699333\+dependabot\[bot\]@users\.noreply\.github\.com$/,
];

/** @param {{ sha: string, name: string, email: string, body: string }[]} commits */
export function dcoErrors(commits) {
  const errors = [];
  for (const c of commits) {
    if (EXEMPT.some((re) => re.test(c.name) || re.test(c.email))) continue;
    const trailers = [...c.body.matchAll(/^Signed-off-by:\s*(.+?)\s*<([^>]+)>\s*$/gim)];
    const ok = trailers.some(([, , email]) => email.toLowerCase() === c.email.toLowerCase());
    if (!ok) {
      errors.push(
        `${c.sha.slice(0, 12)} by ${c.name} <${c.email}> has no matching Signed-off-by (use git commit -s)`
      );
    }
  }
  return errors;
}

export function readCommits(base, head) {
  const sep = '\x1e';
  const out = execFileSync(
    'git',
    ['log', `--format=%H%x1f%an%x1f%ae%x1f%B${sep}`, `${base}..${head}`],
    {
      encoding: 'utf8',
    }
  );
  return out
    .split(sep)
    .map((r) => r.trim())
    .filter(Boolean)
    .map((r) => {
      const [sha, name, email, body] = r.split('\x1f');
      return { sha, name, email, body: body ?? '' };
    });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [base, head] = process.argv.slice(2);
  if (!base || !head) {
    console.error('usage: check-dco.mjs <base> <head>');
    process.exit(2);
  }
  const errors = dcoErrors(readCommits(base, head));
  for (const e of errors) console.error(`dco: ${e}`);
  if (errors.length) process.exit(1);
  console.log('dco: every commit is signed off');
}
