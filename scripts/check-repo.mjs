#!/usr/bin/env node
// Repository-file checks for `just check` (openspec change docs-site): exact dependency pins,
// page locations and file names, page sources, licences, the PR and issue templates, CODEOWNERS,
// the `main` ruleset and the desired repository settings.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse } from 'yaml';
import { sections } from '../src/sections.mjs';
import { listPageFiles } from './lib/pages.mjs';

export const MAINTAINERS = '@getLooma/docs-maintainers';
export const OWNER = '@DevAOC';

const read = (root, rel) => {
  const file = path.join(root, rel);
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
};

function checkPins(root, errors) {
  const pkg = JSON.parse(read(root, 'package.json') ?? '{}');
  for (const field of ['dependencies', 'devDependencies']) {
    for (const [name, version] of Object.entries(pkg[field] ?? {})) {
      if (!/^\d+\.\d+\.\d+$/.test(version)) {
        errors.push(`package.json: ${name} must be pinned to an exact version, not "${version}"`);
      }
    }
  }
}

function checkPages(root, errors) {
  const dirs = new Set(sections.map((s) => s.dir));
  const content = path.join(root, 'src/content/docs');
  for (const file of listPageFiles(content)) {
    const rel = `src/content/docs/${file}`;
    const parts = file.split('/');
    if (parts.length === 1 && !/^index\.mdx?$/.test(file)) {
      errors.push(
        `${rel}: only the home page may sit at the top; use one of: ${[...dirs].join(', ')}`
      );
    } else if (parts.length > 1 && !dirs.has(parts[0])) {
      errors.push(`${rel}: unknown section "${parts[0]}"; allowed: ${[...dirs].join(', ')}`);
    }
    for (const part of parts) {
      if (!/^[a-z0-9]+(-[a-z0-9]+)*(\.mdx?)?$/.test(part)) {
        errors.push(`${rel}: use lowercase, hyphen-separated names ("${part}")`);
      }
    }
    const source = fs.readFileSync(path.join(content, file), 'utf8');
    checkSource(rel, source, errors);
  }
  const pagesDir = path.join(root, 'src/pages');
  if (fs.existsSync(pagesDir)) {
    for (const file of fs.readdirSync(pagesDir, { recursive: true })) {
      if (/\.mdx?$/.test(String(file))) {
        errors.push(`src/pages/${file}: pages belong under src/content/docs/, not src/pages/`);
      }
    }
  }
}

/** Fences must name a language; no client-side hydration in content. */
export function checkSource(rel, source, errors) {
  let inFence = null;
  source.split('\n').forEach((line, i) => {
    const fence = /^(\s*)(`{3,}|~{3,})(.*)$/.exec(line);
    if (fence) {
      if (inFence === null) {
        inFence = fence[2];
        if (!fence[3].trim()) errors.push(`${rel}:${i + 1}: code block without a language`);
      } else if (
        fence[2].startsWith(inFence[0]) &&
        fence[2].length >= inFence.length &&
        !fence[3].trim()
      ) {
        inFence = null;
      }
      return;
    }
    if (inFence === null && /\bclient:[a-z]+/.test(line)) {
      errors.push(
        `${rel}:${i + 1}: client:* directives are not allowed; content must render without JavaScript`
      );
    }
  });
}

function checkLicenses(root, errors) {
  const mit = read(root, 'LICENSE') ?? '';
  if (
    !mit.includes('MIT License') ||
    !mit.includes('Permission is hereby granted, free of charge')
  ) {
    errors.push('LICENSE: must hold the MIT License text');
  }
  const cc = read(root, 'LICENSE-docs') ?? '';
  if (!cc.includes('Attribution 4.0 International') || !cc.includes('Section 1 -- Definitions.')) {
    errors.push('LICENSE-docs: must hold the CC BY 4.0 legal code');
  }
}

export const TEMPLATE_ITEMS = [
  'STYLE_GUIDE.md',
  'just check',
  'No internal details',
  'Signed-off-by',
];

function checkTemplates(root, errors) {
  const template = read(root, '.github/PULL_REQUEST_TEMPLATE.md');
  if (template === null) errors.push('.github/PULL_REQUEST_TEMPLATE.md: missing');
  else {
    for (const item of TEMPLATE_ITEMS) {
      const ok = template.split('\n').some((l) => /^\s*- \[ \]/.test(l) && l.includes(item));
      if (!ok)
        errors.push(`.github/PULL_REQUEST_TEMPLATE.md: no checklist item mentioning "${item}"`);
    }
    if (!/released/i.test(template)) {
      errors.push(
        '.github/PULL_REQUEST_TEMPLATE.md: must ask whether the change describes released behaviour'
      );
    }
  }
  const config = read(root, '.github/ISSUE_TEMPLATE/config.yml');
  if (config === null || parse(config)?.blank_issues_enabled !== false) {
    errors.push('.github/ISSUE_TEMPLATE/config.yml: blank_issues_enabled must be false');
  }
  for (const form of ['docs-error.yml', 'missing-page.yml', 'product-question.yml']) {
    if (read(root, `.github/ISSUE_TEMPLATE/${form}`) === null) {
      errors.push(`.github/ISSUE_TEMPLATE/${form}: missing`);
    }
  }
}

function checkCodeowners(root, errors) {
  const text = read(root, '.github/CODEOWNERS');
  if (text === null) return errors.push('.github/CODEOWNERS: missing');
  const rules = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => l.split(/\s+/));
  const owners = (pattern) => rules.find((r) => r[0] === pattern)?.slice(1) ?? [];
  if (!owners('*').includes(MAINTAINERS)) {
    errors.push(`.github/CODEOWNERS: "*" must be owned by ${MAINTAINERS}`);
  }
  for (const p of ['/.github/', '/scripts/']) {
    if (!owners(p).includes(OWNER))
      errors.push(`.github/CODEOWNERS: "${p}" must be owned by ${OWNER}`);
  }
}

/** The phase 1 rules of the `main` ruleset (design.md D19). Later phases may add rules. */
export function checkRuleset(ruleset, errors, rel = '.github/rulesets/main.json') {
  if (!ruleset) return errors.push(`${rel}: missing`);
  const rule = (type) => ruleset.rules?.find((r) => r.type === type);
  if (ruleset.name !== 'main' || ruleset.target !== 'branch' || ruleset.enforcement !== 'active') {
    errors.push(`${rel}: must be the active branch ruleset named "main"`);
  }
  if (!ruleset.conditions?.ref_name?.include?.includes('~DEFAULT_BRANCH')) {
    errors.push(`${rel}: must target ~DEFAULT_BRANCH`);
  }
  for (const type of ['deletion', 'non_fast_forward', 'pull_request']) {
    if (!rule(type)) errors.push(`${rel}: missing rule "${type}"`);
  }
  const pr = rule('pull_request')?.parameters ?? {};
  if (pr.dismiss_stale_reviews_on_push !== true)
    errors.push(`${rel}: dismiss_stale_reviews_on_push must be true`);
  if (pr.required_review_thread_resolution !== true)
    errors.push(`${rel}: required_review_thread_resolution must be true`);
  if (pr.require_extra_approval_for_unattributed_changes !== true) {
    errors.push(`${rel}: require_extra_approval_for_unattributed_changes must be true`);
  }
  if (JSON.stringify(pr.allowed_merge_methods) !== '["squash"]') {
    errors.push(`${rel}: squash must be the only allowed merge method`);
  }
  if ((ruleset.bypass_actors ?? []).length !== 0)
    errors.push(`${rel}: bypass_actors must be empty`);
}

/** The desired repository settings (docs-delivery spec), applied by scripts/repo-settings. */
export function checkSettings(settings, errors, rel = 'scripts/repo-settings.json') {
  if (!settings) return errors.push(`${rel}: missing`);
  const expect = (cond, msg) => cond || errors.push(`${rel}: ${msg}`);
  const repo = settings.repository ?? {};
  expect(repo.allow_squash_merge === true, 'allow_squash_merge must be true');
  expect(repo.allow_merge_commit === false, 'allow_merge_commit must be false');
  expect(repo.allow_rebase_merge === false, 'allow_rebase_merge must be false');
  expect(repo.delete_branch_on_merge === true, 'delete_branch_on_merge must be true');
  expect(repo.has_issues === true, 'has_issues must be true');
  expect(repo.has_discussions === true, 'has_discussions must be true');
  const sa = repo.security_and_analysis ?? {};
  expect(sa.secret_scanning?.status === 'enabled', 'secret scanning must be enabled');
  expect(
    sa.secret_scanning_push_protection?.status === 'enabled',
    'push protection must be enabled'
  );
  const wf = settings.workflow_permissions ?? {};
  expect(wf.default_workflow_permissions === 'read', 'default_workflow_permissions must be read');
  expect(wf.can_approve_pull_request_reviews === false, 'Actions must not approve pull requests');
  expect(settings.actions?.sha_pinning_required === true, 'sha_pinning_required must be true');
  expect(
    settings.fork_pr_approval?.approval_policy === 'all_external_contributors',
    'fork PR approval must be all_external_contributors'
  );
}

export function checkRepo(root) {
  const errors = [];
  checkPins(root, errors);
  checkPages(root, errors);
  checkLicenses(root, errors);
  checkTemplates(root, errors);
  checkCodeowners(root, errors);
  const json = (rel) => {
    const text = read(root, rel);
    return text === null ? null : JSON.parse(text);
  };
  checkRuleset(json('.github/rulesets/main.json'), errors);
  checkSettings(json('scripts/repo-settings.json'), errors);
  return errors;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const errors = checkRepo(process.argv[2] ?? '.');
  for (const e of errors) console.error(`check-repo: ${e}`);
  if (errors.length) process.exit(1);
  console.log('check-repo: ok');
}
