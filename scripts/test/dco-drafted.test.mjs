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

  it('exempts Dependabot', () => {
    expect(
      dcoErrors([
        commit('Bump', '49699333+dependabot[bot]@users.noreply.github.com', 'dependabot[bot]'),
      ])
    ).toEqual([]);
  });
});

describe('drafted-pr', () => {
  const approved = [{ state: 'APPROVED', user: 'maintainer', association: 'MEMBER' }];
  const base = {
    labels: ['drafted'],
    body: 'Documents the new filter.',
    author: 'looma-docs-bot[bot]',
    reviews: approved,
  };

  it('passes when labelled, clean and approved', () => {
    expect(draftedErrors(base)).toEqual([]);
  });

  it('needs the label', () => {
    expect(draftedErrors({ ...base, labels: [] }).join()).toMatch(/"drafted" label/);
  });

  it('rejects links to other getLooma repositories', () => {
    const body = 'From https://github.com/getLooma/' + 'core/pull/41';
    expect(draftedErrors({ ...base, body }).join()).toMatch(/links another getLooma repository/);
  });

  it('needs an approval from a maintainer, not the author or an outsider', () => {
    expect(draftedErrors({ ...base, reviews: [] }).join()).toMatch(/no approving review/);
    expect(
      draftedErrors({
        ...base,
        reviews: [{ state: 'APPROVED', user: 'x', association: 'NONE' }],
      }).join()
    ).toMatch(/no approving review/);
    const changed = [
      ...approved,
      { state: 'CHANGES_REQUESTED', user: 'maintainer', association: 'MEMBER' },
    ];
    expect(draftedErrors({ ...base, reviews: changed }).join()).toMatch(/no approving review/);
  });
});
