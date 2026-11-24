---
title: Reply with macros
description: Insert a saved reply into the reply box with Ctrl+/ or ⌘/, check its preview for this conversation, and fill in any missing value before you send.
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
