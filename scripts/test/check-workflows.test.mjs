import { describe, expect, it } from 'vitest';
import { checkWorkflow, checkWorkflows } from '../check-workflows.mjs';

const ok = `on: [push]\npermissions:\n  contents: read\njobs:\n  a:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1\n`;

describe('check-workflows', () => {
  it('passes on the real workflows', () => {
    expect(checkWorkflows('.github/workflows')).toEqual([]);
  });

  it('passes a minimal safe workflow', () => {
    expect(checkWorkflow('x.yml', ok)).toEqual([]);
  });

  it('rejects pull_request_target and workflow_run', () => {
    expect(checkWorkflow('x.yml', ok.replace('[push]', '[pull_request_target]')).join()).toMatch(
      /pull_request_target/
    );
    expect(checkWorkflow('x.yml', ok.replace('[push]', '[workflow_run]')).join()).toMatch(
      /workflow_run/
    );
  });

  it('rejects missing top-level permissions', () => {
    expect(
      checkWorkflow('x.yml', ok.replace('permissions:\n  contents: read\n', '')).join()
    ).toMatch(/no top-level permissions/);
  });

  it('rejects an action pinned by tag', () => {
    expect(checkWorkflow('x.yml', ok.replace(/@[0-9a-f]{40}/, '@v7')).join()).toMatch(
      /full commit SHA/
    );
  });

  it('rejects secrets in ci.yml', () => {
    expect(
      checkWorkflow('ci.yml', ok + '        with:\n          token: ${{ secrets.X }}\n').join()
    ).toMatch(/must not reference secrets/);
  });

  it('rejects links.yml on pull requests and deploy.yml without the environment', () => {
    expect(
      checkWorkflow('links.yml', ok.replace('[push]', '[schedule, pull_request]')).join()
    ).toMatch(/only schedule/);
    expect(checkWorkflow('deploy.yml', ok).join()).toMatch(/environment production/);
  });
});
