# Contributing to the Looma docs

**Anyone can propose a change. A member of the Looma team reviews it and merges it.**

Thank you for helping. These docs are open source so that the people who use Looma can fix what
is wrong and add what is missing. You don't need to work at Looma, and you don't need to be a
developer.

## Ways to help

- **Fix a typo or a wrong sentence:** use **Edit page** at the bottom of any page. GitHub opens
  the file in your browser, makes a fork for you, and turns your edit into a pull request.
- **Report a wrong or missing page:** open an issue with the
  [docs error](https://github.com/getLooma/docs/issues/new?template=docs-error.yml) or
  [missing page](https://github.com/getLooma/docs/issues/new?template=missing-page.yml) form.
- **Propose a new page:** open an issue first. The docs describe only what Looma does today, so a
  team member confirms the scope before you write.
- **Ask a question about using Looma:** that's for support, not the docs repository. See the
  [product question](https://github.com/getLooma/docs/issues/new?template=product-question.yml)
  form for where to ask.
- **Discuss an idea:** use [Discussions](https://github.com/getLooma/docs/discussions).

## Making a change

1. Fork the repository and create a branch.
2. Edit or add Markdown under `src/content/docs/`, in the section the page belongs to (see
   [STYLE_GUIDE.md](STYLE_GUIDE.md)).
3. Preview it with `just dev` (or `pnpm install && pnpm dev` without Nix).
4. Run `just check`. It checks formatting, links, metadata, the page structure and the prose
   rules. CI runs the same checks on your pull request.
5. Sign off every commit (see below), push, and open a pull request. Fill in the template.

CI also uploads the built site to every pull request as an artifact named `site`. To browse it,
download it, unzip it and run `npx serve site`.

## Who reviews and merges

- Outside contributors have read access, so they work from a fork. Only members of the
  `@getLooma/dev` team can merge.
- Every change to `main` goes through a pull request. Nobody pushes to `main` directly, and
  pull requests are squash-merged.
- A team member reviews every pull request. They check accuracy against the product, the
  style guide and the template checklist. The team, not the contributor, confirms how the
  product behaves.
- Review conversations must be resolved before merging.
- Maintainers aim to answer within five working days. A pull request with no activity for 30
  days after a review request is closed with thanks; you can reopen it at any time.
- Pull requests drafted automatically by the Looma docs bot follow exactly the same rules. A
  team member always reviews and merges them; the bot never merges its own pull request.

## Sign-off (DCO)

Every commit must be signed off under the
[Developer Certificate of Origin 1.1](https://developercertificate.org): you certify that you
wrote the change, or have the right to submit it, under this repository's licenses. Add the
sign-off with `git commit -s`, which appends a line like this one:

```text
Signed-off-by: Your Name <you@example.com>
```

The `dco` check fails if a commit lacks a sign-off that matches its author's email. To fix the
last commit, run `git commit --amend -s`. For several commits, run
`git rebase --signoff main`, then push.

Using **Edit page** in the browser? Tick "Sign off and commit changes" when GitHub shows it, or
add the `Signed-off-by:` line to the commit message yourself.

## Licensing

By contributing, you agree that your contribution is licensed under the same terms as the rest
of the repository ("inbound = outbound"):

- documentation text and images (`src/content/`, `src/assets/`) under
  [CC BY 4.0](LICENSE-docs);
- everything else under the [MIT License](LICENSE).

## What never goes in these docs

The repository is public. Never add internal host names or URLs, names of private repositories
or services, configuration that users can't change, security internals, features that are not
released yet, or any real customer, person, email, order or message. Screenshots use invented
sample data only. `just check` catches some of this; reviewers catch the rest.

## Security

Never report a security problem in an issue. See [SECURITY.md](SECURITY.md).

## Code of conduct

Everyone taking part follows the [Code of Conduct](CODE_OF_CONDUCT.md).
