---
title: Tag conversations
description: Admins create the organization's tags in Settings → Tags, and any member adds up to 10 of them to a conversation from the conversation page.
---

Tags are labels your team chooses, such as "Refund" or "VIP". Admins create them under
**Settings → Tags**, and any member adds them to a conversation from the conversation page. You
can then filter the inbox by tag and save that filter as a view.

## Before you start

- To create, edit or delete tags, you need the admin role.
- Any member can add tags to a conversation and remove them.

## Create a tag

1. Go to **Settings** and click **Manage tags** in the **Tags** card.
2. Under **New tag**, enter a **Name** and choose a **Colour**.
3. Click **Create tag**. The tag appears in the list, with the number of conversations that
   carry it.

An organization has at most 100 tags. A name is 1 to 40 characters, and two tags can't share a
name, whatever their case. There are nine colours: gray, red, orange, amber, green, teal, blue,
violet and pink. The name is always shown, so colour is never the only way to tell tags apart.

## Edit or delete a tag

- To rename or recolour a tag, click **Edit** next to it, make the change and click **Save tag**.
  Every conversation that carries the tag shows the new name.
- To delete a tag, click **Delete** next to it. The confirmation says how many conversations
  carry it. Deleting removes the tag from every conversation and from every saved view that
  filters by it, and it can't be undone.

## Tag a conversation

1. Open the conversation.
2. Click **Tags**.
3. Check the tags the conversation carries, and uncheck the ones to remove. Use the search box
   to find a tag by name.

A conversation carries at most 10 tags. Once it has 10, the other tags can't be checked until
you clear one. If your organization has no tags yet, the picker says so; admins see a link to
**Settings → Tags**.

In the inbox, each conversation shows up to three of its tags, then "+N" for the rest.

A [macro](../manage-macros/) can also add tags when an agent sends a reply with it.

## Tag an issue's conversations automatically

Admins can link up to three tags to an issue. Every conversation in the issue then carries them:
the ones already in it, and each one Looma adds to it later.

1. Open the issue.
2. Click **Tag its conversations** (or **Change**, once the issue has tags).
3. Check the tags to link, up to three.
4. If the issue already has conversations, Looma asks **Tag the N conversations already in this
   issue?** Click **Tag them** to link the tag and tag them, or **Cancel**.

Agents see an issue's linked tags but can't change them.

How automatic tags behave:

- On the conversation page, a tag that an issue applied is marked **auto**. The inbox shows it
  like any other tag.
- A conversation that already carries 10 tags is skipped, without a warning. It doesn't get the
  issue's tag, and its other tags stay.
- If a member removes an automatic tag from a conversation, that issue doesn't add it again.
- Unlinking a tag from the issue, or deleting the issue, leaves the tag on the conversations that
  already carry it. New conversations in the issue no longer get it.
- Deleting a tag removes it from every issue it was linked to.

In **Settings → Tags**, a tag linked to issues shows "Linked to N issues".

## Tags in data request exports

When an admin exports a customer's data for a data request, each conversation in the export
lists the names of its tags. Redacting a customer keeps the tags on their conversations.

## Related

- [Filter the inbox](../filter-the-inbox/) by one or more tags.
- [Save inbox views](../saved-views/) to keep a tag filter in the sidebar.
- [Create and manage macros](../manage-macros/) that add tags when a reply is sent.
