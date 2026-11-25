---
title: Reply with macros
description: Insert a saved reply with Ctrl+/ or ⌘/, check its preview and actions for this conversation, and fill in any missing value before you send.
---

A macro is a saved reply your admins write once, with variables such as the customer's first
name or their latest order number. In the reply box, press <kbd>Ctrl</kbd>+<kbd>/</kbd>
(<kbd>⌘</kbd>+<kbd>/</kbd> on macOS) or click **Macros**, choose a macro, and Looma fills in the
variables for this conversation before you insert it.

## Insert a macro

1. Open the conversation and click in the reply box.
2. Press <kbd>Ctrl</kbd>+<kbd>/</kbd> (<kbd>⌘</kbd>+<kbd>/</kbd> on macOS), or click **Macros**.
   The **Insert a macro** dialog opens, with the most used macros first.
3. Type in the search field to find a macro by name, keyword or text. Use <kbd>Up</kbd> and
   <kbd>Down</kbd> to move through the list and <kbd>Enter</kbd> to choose one.
4. Check the preview. Values Looma filled in are highlighted, and each missing value is listed
   under the reply as "… has no value".
5. Click **Insert**. The text goes into the reply box where your cursor was.

Press <kbd>Escape</kbd> to close the dialog without inserting anything. You can edit the inserted
text like any reply before you send it.

## Apply a macro's actions

Some macros also change the conversation when you send the reply: they set its status or
priority, assign it, or add tags. The preview lists these under **When sent**, for example
"set Pending · priority 2 · assign to you · add tag Shipping".

- **Apply actions** is ticked by default. Untick it to insert only the text.
- The actions apply when you click **Send**, together with the reply. Nothing changes when you
  insert the macro.
- Only one macro's actions apply per reply: the last one you inserted with **Apply actions**
  ticked.
- The reply and the actions succeed or fail together. If Looma can't apply the actions, nothing
  is sent, the reply stays in the box, and Looma says why.

Looma refuses to send with the actions when:

- the macro assigns to someone who is no longer a member of your organization;
- the conversation would carry more than 10 tags;
- an admin changed the macro after you previewed it. Insert it again to see the current version.

The preview warns about the first two before you insert the macro. To send anyway, untick
**Apply actions**. To undo an action after sending, change the conversation's
[status, assignee or priority](../conversation-settings/) or [remove the tag](../tags/).

## Fill in missing values

When Looma can't find a value, for example a customer with no name on record, the macro keeps
the variable's placeholder, such as `{{customer.first_name}}`. Looma never sends a reply with a
blank in it:

- A notice above **Send** says **Fill in N gaps before sending**, with a button for each one.
- Click a button to select that placeholder, then type the value over it.
- **Send** stays off until every placeholder is replaced.

Braces that don't name a variable, such as `{{order.id}}`, are ordinary text and don't block
sending.

## How usage is counted

Each macro you insert counts once when you send the reply, for up to five macros per reply.
Admins see each macro's count and when it was last used on the **Macros** page, and the most used
macros come first in the picker.

## Related

- [Create and manage macros](../manage-macros/) (admins).
- [Macro variables](../macro-variables/): what each variable fills in.
- [Set a conversation's status, assignee and priority](../conversation-settings/).
