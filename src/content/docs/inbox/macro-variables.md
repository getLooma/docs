---
title: Macro variables
description: The nine variables a macro can use, such as the customer's first name or latest order total, and where Looma finds each value.
---

A macro can use nine variables. Looma fills each one in from your organization's own data when an
agent inserts the macro, and keeps the placeholder when it has no value, so the agent fills it in
by hand before sending.

| Variable                  | Button in the editor    | Filled in with                                            |
| ------------------------- | ----------------------- | --------------------------------------------------------- |
| `{{customer.name}}`       | **Customer name**       | The customer's name                                       |
| `{{customer.first_name}}` | **Customer first name** | The first word of the customer's name                     |
| `{{customer.email}}`      | **Customer email**      | The customer's email address                              |
| `{{order.latest.number}}` | **Latest order number** | The number of the customer's most recent order            |
| `{{order.latest.total}}`  | **Latest order total**  | That order's total and currency, such as `42.50 EUR`      |
| `{{order.latest.date}}`   | **Latest order date**   | The day that order was placed, such as `20 November 2026` |
| `{{agent.name}}`          | **Agent name**          | The name of the member inserting the macro                |
| `{{agent.first_name}}`    | **Agent first name**    | The first word of that member's name                      |
| `{{organization.name}}`   | **Organization name**   | Your organization's name                                  |

## Where the values come from

- **Customer values** come from what your organization holds about the customer: the details from
  the integration the conversation arrived through first, then the newest details from your
  other integrations.
- **Order values** come from the customer's most recent order in your organization, for example
  from your connected Shopify store.
- Looma reads only your organization's data.

## How values are written

- A value is written on one line: line breaks become spaces.
- A value is cut to 200 characters.
- A value can never add a placeholder of its own.

## Related

- [Reply with macros](../macros/): insert a macro and fill in missing values.
- [Create and manage macros](../manage-macros/).
