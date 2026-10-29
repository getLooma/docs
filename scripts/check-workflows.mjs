#!/usr/bin/env node
// Workflow-safety checks for `just check` (docs-delivery spec, "Fork pull requests never see
// secrets"): no pull_request_target / workflow_run, top-level permissions, third-party actions
// pinned to a full commit SHA, no secrets in the pull request CI, the review only for same-repo
// pull requests, links only on a schedule, deploys only from main.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse } from 'yaml';

const triggersOf = (wf) => {
  const on = wf.on ?? wf[true]; // YAML 1.1 parsers may read `on` as true
  if (typeof on === 'string') return [on];
  if (Array.isArray(on)) return on;
  return Object.keys(on ?? {});
};

export function checkWorkflow(name, text) {
  const errors = [];
  const wf = parse(text) ?? {};
  const triggers = triggersOf(wf);
  for (const bad of ['pull_request_target', 'workflow_run']) {
    if (triggers.includes(bad)) errors.push(`${name}: uses the ${bad} trigger`);
  }
  if (!wf.permissions || typeof wf.permissions !== 'object') {
    errors.push(`${name}: no top-level permissions block`);
  } else if (wf.permissions.contents && wf.permissions.contents !== 'read') {
    errors.push(`${name}: top-level contents permission must be read`);
  }
  for (const [jobName, job] of Object.entries(wf.jobs ?? {})) {
    for (const step of job.steps ?? []) {
      const uses = step.uses;
      if (!uses || uses.startsWith('./') || uses.startsWith('docker://')) continue;
      if (!/^[\w.-]+\/[\w./-]+@[0-9a-f]{40}$/.test(uses)) {
        errors.push(
          `${name}: job ${jobName} uses "${uses}"; pin third-party actions to a full commit SHA`
        );
      }
    }
  }
  if (name === 'ci.yml' && /\bsecrets\./.test(text))
    errors.push('ci.yml: must not reference secrets');
  if (name === 'drafted-pr.yml' && /\bsecrets\./.test(text))
    errors.push('drafted-pr.yml: must not reference secrets');
  if (name === 'pr-review.yml') {
    const cond = String(wf.jobs?.review?.if ?? '');
    if (!cond.includes('github.event.pull_request.head.repo.full_name == github.repository')) {
      errors.push('pr-review.yml: the review job must require a same-repository pull request');
    }
  }
  if (name === 'links.yml') {
    const extra = triggers.filter((t) => !['schedule', 'workflow_dispatch'].includes(t));
    if (extra.length)
      errors.push(
        `links.yml: only schedule and workflow_dispatch triggers, not ${extra.join(', ')}`
      );
  }
  if (name === 'deploy.yml') {
    if (triggers.includes('pull_request'))
      errors.push('deploy.yml: must not run for pull requests');
    if (wf.jobs?.deploy?.environment !== 'production')
      errors.push('deploy.yml: the deploy job must use environment production');
  }
  return errors;
}

export function checkWorkflows(dir = '.github/workflows') {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => /\.ya?ml$/.test(f))
    .flatMap((f) => checkWorkflow(f, fs.readFileSync(path.join(dir, f), 'utf8')));
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const errors = checkWorkflows(process.argv[2]);
  for (const e of errors) console.error(`check-workflows: ${e}`);
  if (errors.length) process.exit(1);
  console.log('check-workflows: ok');
}
