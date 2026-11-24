---
title: Create and manage macros
description: Admins write the organization's macros on the Macros page, with a reply that can use variables, keywords, and actions applied when it is sent.
---

Admins create, edit and delete the organization's macros on the **Macros** page in the sidebar.
Every member can then insert them from the reply box. Each macro has a name, the reply text, and
keywords that help agents find it.

## Before you start

- You need the admin role. Other members don't see the **Macros** page, but they can use every
  macro from the reply box.
- An organization has at most 300 macros.

## Create a macro

1. Click **Macros** in the sidebar, then **New macro**.
2. Enter a **Name** of up to 80 characters. Two macros can't share a name, whatever their case.
3. Write the **Reply**, up to 5,000 characters of plain text. Line breaks are kept.
4. To add a variable, put the cursor where it goes and click its button under
   **Insert a variable**, such as **Customer first name**.
5. Optionally, enter **Keywords** separated by commas: up to 10, each up to 40 characters.
6. Optionally, choose what the macro does to the conversation under **When sent**. See
   [Add actions to a macro](#add-actions-to-a-macro).
7. Click **Create macro**.

Looma refuses a reply that names a variable it doesn't know, such as `{{customer.phone}}`, and
says which one. See [Macro variables](../macro-variables/) for the full list.

For example, a reply can start with "Hi `{{customer.first_name}}`," and end with
"`{{agent.first_name}}` at `{{organization.name}}`".

## Add actions to a macro

Under **When sent**, a macro can change the conversation when an agent sends a reply with it.
Each action is **Leave as is** until you choose a value.

| Action           | Choices                                                                   |
| ---------------- | ------------------------------------------------------------------------- |
| **Set status**   | **Open**, **Pending**, **Resolved** or **Closed**                         |
| **Set priority** | **1 (most urgent)** to **25**                                             |
| **Assign**       | **The member who sends**, **Nobody (unassign)**, or a member you name     |
| **Add tags**     | Up to 10 of your organization's [tags](../tags/); they never remove a tag |

Actions change only the conversation the reply is sent in. They apply when the agent leaves
**Apply actions** ticked, and a macro's actions need no more rights than making the same changes
by hand. See [Reply with macros](../macros/#apply-a-macros-actions) for what agents see.

If the member a macro assigns to leaves your organization, the editor marks the macro's
**Assign** choice as "A former member". Choose someone else: until then, agents can send the
macro's text but not its actions.

## Save a sent reply as a macro

Admins can turn a reply a member already sent into a new macro.

1. Open the conversation and find the reply.
2. Click **Save as macro** under it. The **Macros** page opens with a new macro, its **Reply**
   filled in from the sent text.
3. Check the text. Looma replaces the customer's name, first name and email, their latest order's
   number, total and date, the sender's name and first name, and your organization's name with
   their [variables](../macro-variables/). It matches whole words with the same capitals only, so
   it can miss a value written another way. As the notice says, check the text for personal
   details before saving.
4. Enter a **Name**, and keywords or actions if you want them.
5. Click **Create macro**.

**Save as macro** appears on replies members sent, not on customer messages or internal notes.
Nothing is saved until you click **Create macro**.

## See how macros are used

The list shows each macro's keywords, how many times it was **Used**, and when it was **Last
used**, with the most used macros first. A macro counts once for each reply sent with it.

## Edit or delete a macro

- Click the pencil icon next to a macro, make your changes, including its actions, and click
  **Save macro**.
- Click the bin icon, then **Delete macro**, to remove it. It disappears from the reply box along
  with its usage count. Replies already sent aren't changed.
