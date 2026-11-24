---
title: Create and manage macros
description: Admins write the organization's macros on the Macros page, with a name, a reply that can use variables, and keywords agents search for.
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
6. Click **Create macro**.

Looma refuses a reply that names a variable it doesn't know, such as `{{customer.phone}}`, and
says which one. See [Macro variables](../macro-variables/) for the full list.

For example, a reply can start with "Hi `{{customer.first_name}}`," and end with
"`{{agent.first_name}}` at `{{organization.name}}`".

## See how macros are used

The list shows each macro's keywords, how many times it was **Used**, and when it was **Last
used**, with the most used macros first. A macro counts once for each reply sent with it.

## Edit or delete a macro

- Click the pencil icon next to a macro, make your changes and click **Save macro**.
- Click the bin icon, then **Delete macro**, to remove it. It disappears from the reply box along
  with its usage count. Replies already sent aren't changed.
