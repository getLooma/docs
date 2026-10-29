# Style guide

How to write the Looma docs. Every page follows it, whether a person or the docs bot wrote it.
Reviewers use it, and `just check` enforces the parts a machine can check.

## Who we write for

Support agents and the admins who set Looma up for their team. They are good at support and
busy, but they are not developers. They open a page to get something done. Write for that
moment.

## Answer first

The first paragraph answers the question the title asks, in one or two sentences. The details,
steps and exceptions come after it. Search engines and AI assistants quote that first paragraph,
so it has to stand on its own.

> **Title:** Invite people to your organization
>
> Admins invite people from **Settings → Team**. Each person gets an email with a link and joins
> with the role you chose.

## Page types

Pick one type per page. If a page needs two, split it.

### Task

Gets one job done.

```markdown
---
title: Connect your Shopify store
description: Install the Looma app from the Shopify App Store to bring your store's customers and orders into Looma.
---

One-paragraph answer: what this does and the result.

## Before you start

- What the reader needs (a role, an account).

## Connect the store

1. One action per step, starting with the verb. Click **Connect** in **Settings → Integrations**.
2. Say what the reader sees when it worked.

## What happens next

The result, and where to go from here.
```

### Concept

Explains what something is and why it matters, such as what an issue is. Sections: what it
is, why it matters, how it relates to other things, and links to the tasks.

### Reference

Facts to look up, mostly tables: roles and what each can do, or the fields of a conversation
analysis. Keep each row short. Put explanations on the concept page.

### Troubleshooting

One problem per heading, written the way the reader would describe it. Under it, give the cause,
then the fix as steps.

## Voice

- Address the reader as "you". Write in the present tense and the active voice: "Looma groups
  the conversation into an issue", not "the conversation will be grouped".
- Use plain words and short sentences of about 25 words at most.
- Don't write "simply", "just", "easy" or "obviously". If it were easy, nobody would read the
  page.
- Never promise future features or dates ("coming soon"). The docs describe what Looma does
  today.

## Formatting

- **Headings:** sentence case ("Connect your store"). Never put an `h1` (`#`) in the body; the
  title is the `h1`. Never skip a level: `##` then `###`.
- **UI labels:** in bold, exactly as the product shows them: **Settings**, **Suggested reply**.
  Use **→** for a path through menus: **Settings → Team**.
- **Keys:** `<kbd>Enter</kbd>`.
- **Code blocks:** always name the language (`text`, `json`, `sh`).
- **Lists:** numbered lists for steps, bullets for anything else. Use tables to compare things.
- **Asides:** `:::note`, `:::tip` and `:::caution` for what the reader must not miss. Use them
  sparingly.
- **Links:** descriptive link text, never "click here". Link between pages with relative paths
  (`../issues/`).

## Words we use

Use the product's own words exactly, as the Looma app shows them:

| Use                   | Not                          |
| --------------------- | ---------------------------- |
| organization          | workspace, tenant, account   |
| integration           | connector, app connection    |
| customer              | contact, end user, shopper   |
| conversation, message | ticket, thread, chat         |
| conversation analysis | AI score, sentiment report   |
| issue                 | ticket cluster, topic, theme |
| suggested reply       | AI draft, autoreply          |

An issue has a **kind** (question, problem or request), a **severity** and a **status**. Vale
checks these terms (`styles/Looma/`).

## Frontmatter

Every page starts with:

```yaml
---
title: Invite people to your organization # at most 60 characters, unique
description: Admins invite teammates by email and choose each person's role; the invite link works once. # 50–160 characters, unique
---
```

- `title`: what the reader wants to do or know, in sentence case. Don't add "Looma"; the site
  adds it.
- `description`: one complete sentence that answers the page's question. It becomes the search
  result snippet and the summary in `llms.txt`.
- `faq` (FAQ page only): a list of `question` and `answer` pairs, each also a heading on the page.

## Images

- PNG or WebP, under `src/assets/<section>/`, cropped to the part that matters.
- Alt text says what the image shows ("The Team settings page with the Invite button
  highlighted"). An image that adds nothing is better removed.
- **Screenshots use invented sample data only:** Acme Store, `jane@example.com`, order #1001.
  Never a real customer, organization, person, email address, phone number, order or message.

## Never in these docs

This repository is public, and so is every draft, issue and pull request in it.

- Internal host names or URLs, IP addresses, ports.
- Names of private repositories, services, packages, tables, queues or workflows.
- Environment variables or configuration that users cannot set.
- How Looma's infrastructure, vendors or security mechanisms work, beyond what a user must do.
- Features that are not released, or release dates.
- Any real customer, organization, person or message.

When in doubt, leave it out and ask in the pull request.
