#!/usr/bin/env node
// Public-content patterns for scripts/check-public (docs-delivery spec, "Nothing internal
// reaches the public repository"). Generic on purpose: the specific denylist lives with the
// drafting automation, privately. Usage: check-public.mjs [root]
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const RULES = [
  {
    name: 'private network address',
    re: /\b(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|169\.254\.\d{1,3}\.\d{1,3})\b/,
  },
  { name: 'local address with a port', re: /\b(localhost|127\.0\.0\.1|0\.0\.0\.0):\d+/ },
  { name: 'internal host name', re: /\b[a-z0-9-]+(\.[a-z0-9-]+)*\.(internal|local|lan)\b/i },
  { name: 'private container image', re: /\bghcr\.io\/getlooma\/(?!docs\b)[a-z0-9._-]+/i },
  {
    name: 'link to a private repository',
    re: /github\.com\/getlooma\/(?!docs(\b|\/|$))[a-z0-9._-]+/i,
  },
  // Only in pages: tooling files must name CI variables, users never need internal ones.
  { name: 'environment variable name', re: /\b[A-Z][A-Z0-9]*_[A-Z0-9_]*[A-Z0-9]\b/, content: true },
];

const SKIP = [
  /^pnpm-lock\.yaml$/,
  /\.(png|jpe?g|webp|gif|ico|ttf|woff2?)$/i,
  /^LICENSE-docs$/,
  /^src\/fonts\//,
];

export function readAllowlist(file) {
  if (!fs.existsSync(file)) return [];
  return fs
    .readFileSync(file, 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));
}

/** Findings for one file's text; a match is allowed when an allowlist entry equals it. */
export function scanText(rel, text, allow) {
  const findings = [];
  const isContent = rel.startsWith('src/content/');
  text.split('\n').forEach((line, i) => {
    for (const rule of RULES) {
      if (rule.content && !isContent) continue;
      const re = new RegExp(
        rule.re.source,
        rule.re.flags.includes('g') ? rule.re.flags : rule.re.flags + 'g'
      );
      for (const m of line.matchAll(re)) {
        if (!allow.includes(m[0])) findings.push(`${rel}:${i + 1}: ${rule.name} (${m[0]})`);
      }
    }
  });
  return findings;
}

export function listFiles(root) {
  const out = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], {
    cwd: root,
    encoding: 'utf8',
  });
  return out.split('\n').filter(Boolean);
}

export function checkPublic(root = '.', files = listFiles(root)) {
  const allow = readAllowlist(path.join(root, 'scripts/public-allowlist.txt'));
  const findings = [];
  for (const rel of files) {
    if (SKIP.some((re) => re.test(rel))) continue;
    const file = path.join(root, rel);
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) continue;
    findings.push(...scanText(rel, fs.readFileSync(file, 'utf8'), allow));
  }
  return findings;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const findings = checkPublic(process.argv[2] ?? '.');
  for (const f of findings) console.error(`check-public: ${f}`);
  if (findings.length) {
    console.error(
      'check-public: remove these, or (owners only) allow an exact match in scripts/public-allowlist.txt'
    );
    process.exit(1);
  }
  console.log('check-public: ok');
}
