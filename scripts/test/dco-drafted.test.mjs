import { describe, expect, it } from 'vitest';
import { dcoErrors } from '../check-dco.mjs';
import { draftedErrors } from '../check-drafted-pr.mjs';

const commit = (body, email = 'jane@example.com', name = 'Jane') => ({
  sha: 'a'.repeat(40),
  name,
  email,
  body,
});

describe('check-dco', () => {
  it('accepts a matching sign-off', () => {
    expect(dcoErrors([commit('Fix\n\nSigned-off-by: Jane <jane@example.com>')])).toEqual([]);
  });

  it('rejects a missing or mismatched sign-off', () => {
    expect(dcoErrors([commit('Fix')])).toHaveLength(1);
    expect(dcoErrors([commit('Fix\n\nSigned-off-by: Bob <bob@example.com>')])).toHaveLength(1);
  });

  it('skips merge commits, such as GitHub\'s "Update branch"', () => {
    expect(dcoErrors([{ ...commit('Merge branch main into fix'), parents: 2 }])).toEqual([]);
  });

  it('still checks a single-parent commit without a sign-off', () => {
    expect(dcoErrors([{ ...commit('Fix'), parents: 1 }])).toHaveLength(1);
  });

  it('exempts Dependabot', () => {
    expect(
      dcoErrors([
        commit('Bump', '49699333+dependabot[bot]@users.noreply.github.com', 'dependabot[bot]'),
      ])
    ).toEqual([]);
  });
});

describe('drafted-pr', () => {
  const base = { labels: ['drafted'], body: 'Documents the new filter.' };

  it('passes when labelled and clean, with no approval needed', () => {
    expect(draftedErrors(base)).toEqual([]);
  });

  it('needs the label', () => {
    expect(draftedErrors({ ...base, labels: [] }).join()).toMatch(/"drafted" label/);
  });

  it('rejects links to other getLooma repositories', () => {
    const body = 'From https://github.com/getLooma/' + 'core/pull/41';
    expect(draftedErrors({ ...base, body }).join()).toMatch(/links another getLooma repository/);
  });
});
