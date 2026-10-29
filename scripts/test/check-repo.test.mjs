import fs from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { checkRepo, checkRuleset, checkSettings, checkSource } from '../check-repo.mjs';
import { DESC, page, tempDir, write } from './helpers.mjs';

const real = (rel) => fs.readFileSync(path.join(import.meta.dirname, '../..', rel), 'utf8');

function passingRepo() {
  const root = tempDir();
  for (const rel of [
    'package.json',
    'LICENSE',
    'LICENSE-docs',
    '.github/PULL_REQUEST_TEMPLATE.md',
    '.github/ISSUE_TEMPLATE/config.yml',
    '.github/ISSUE_TEMPLATE/docs-error.yml',
    '.github/ISSUE_TEMPLATE/missing-page.yml',
    '.github/ISSUE_TEMPLATE/product-question.yml',
    '.github/CODEOWNERS',
    '.github/rulesets/main.json',
    'scripts/repo-settings.json',
  ]) {
    write(root, rel, real(rel));
  }
  write(root, 'src/content/docs/index.mdx', page('Home', DESC));
  write(root, 'src/content/docs/inbox/assign-conversations.md', page('Assign', DESC));
  return root;
}

describe('check-repo', () => {
  let root;
  beforeEach(() => {
    root = passingRepo();
  });

  it('passes on the real files', () => {
    expect(checkRepo(root)).toEqual([]);
  });

  it('rejects a range version', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    pkg.dependencies.astro = '^7.3.8';
    write(root, 'package.json', JSON.stringify(pkg));
    expect(checkRepo(root).join('\n')).toMatch(/astro must be pinned/);
  });

  it('rejects a page in an unknown section', () => {
    write(root, 'src/content/docs/billing/plans.md', page('Plans', DESC));
    expect(checkRepo(root).join('\n')).toMatch(/billing\/plans\.md: unknown section "billing"/);
  });

  it('rejects an uppercase or underscored file name', () => {
    write(root, 'src/content/docs/inbox/Assign_Conversations.md', page('X', DESC));
    expect(checkRepo(root).join('\n')).toMatch(/Assign_Conversations\.md: use lowercase/);
  });

  it('rejects a Markdown page under src/pages', () => {
    write(root, 'src/pages/about.md', page('About', DESC));
    expect(checkRepo(root).join('\n')).toMatch(/src\/pages\/about\.md: pages belong under/);
  });

  it('rejects a missing licence text', () => {
    write(root, 'LICENSE', 'All rights reserved.');
    expect(checkRepo(root).join('\n')).toMatch(/LICENSE: must hold the MIT License/);
  });

  it('rejects a template without the checklist', () => {
    write(
      root,
      '.github/PULL_REQUEST_TEMPLATE.md',
      '## What changed\n\n- [ ] Released behaviour\n'
    );
    expect(checkRepo(root).join('\n')).toMatch(/no checklist item mentioning "just check"/);
  });

  it('rejects CODEOWNERS without the team or the owner rules', () => {
    write(root, '.github/CODEOWNERS', '* @someone\n');
    const out = checkRepo(root).join('\n');
    expect(out).toMatch(/"\*" must be owned by @getLooma\/docs-maintainers/);
    expect(out).toMatch(/"\/\.github\/" must be owned/);
  });

  it('rejects blank issues', () => {
    write(root, '.github/ISSUE_TEMPLATE/config.yml', 'blank_issues_enabled: true\n');
    expect(checkRepo(root).join('\n')).toMatch(/blank_issues_enabled must be false/);
  });
});

describe('checkSource', () => {
  it('flags a fence without a language and a client directive', () => {
    const errors = [];
    checkSource('p.mdx', '```\ncode\n```\n\n<Widget client:load />\n', errors);
    expect(errors.join('\n')).toMatch(/p\.mdx:1: code block without a language/);
    expect(errors.join('\n')).toMatch(/p\.mdx:5: client:\* directives/);
  });

  it('accepts a labelled fence that mentions client: inside', () => {
    const errors = [];
    checkSource('p.md', '```text\nclient:load\n```\n', errors);
    expect(errors).toEqual([]);
  });
});

describe('checkRuleset', () => {
  const ruleset = () => JSON.parse(real('.github/rulesets/main.json'));

  it('accepts the committed phase 1 ruleset', () => {
    const errors = [];
    checkRuleset(ruleset(), errors);
    expect(errors).toEqual([]);
  });

  it('rejects a missing rule, a merge commit and a bypass actor', () => {
    const r = ruleset();
    r.rules = r.rules.filter((x) => x.type !== 'deletion');
    r.rules.find((x) => x.type === 'pull_request').parameters.allowed_merge_methods = [
      'squash',
      'merge',
    ];
    r.bypass_actors = [{ actor_type: 'OrganizationAdmin', bypass_mode: 'always' }];
    const errors = [];
    checkRuleset(r, errors);
    const out = errors.join('\n');
    expect(out).toMatch(/missing rule "deletion"/);
    expect(out).toMatch(/squash must be the only/);
    expect(out).toMatch(/bypass_actors must be empty/);
  });
});

describe('checkSettings', () => {
  it('rejects merge commits and SHA pinning off', () => {
    const s = JSON.parse(real('scripts/repo-settings.json'));
    s.repository.allow_merge_commit = true;
    s.actions.sha_pinning_required = false;
    const errors = [];
    checkSettings(s, errors);
    expect(errors.join('\n')).toMatch(/allow_merge_commit must be false/);
    expect(errors.join('\n')).toMatch(/sha_pinning_required must be true/);
  });
});
