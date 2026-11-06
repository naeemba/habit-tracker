# Items: decisions

Settled questions. Read the entry before re-litigating it.

## items-decision-1: `kind` is derived, not asked

The four schedule types already split habits from chores, so `kind` comes from
the schedule on the way in. That is what stops an item calling itself a chore
while carrying a habit's schedule. (2026-09-16, #3)

## items-decision-2: One form and one action for add and edit

`saveItem` creates when `id` is null and overwrites otherwise, so the add form
and the edit form cannot validate differently. (2026-09-16, #3)

## items-decision-3: A refused save hands back what was typed

React empties an uncontrolled form the moment its action returns, so without
the echo one missing weekday would wipe the name, the points and the reminder
with it, and on a phone that is the whole item typed again. The form remounts on
a refusal count rather than on the message, so two tries that fail the same way
both redraw. (2026-09-16, #3)

## items-decision-4: Delete on the item's page, and hard for now

Delete is not on the list, so a mistap cannot reach it. Archiving instead of
deleting is its own card. (2026-09-16, #3)

## items-decision-5: `schedule` is jsonb

Rather than text, so nothing has to parse it on the way out. The shape is still
untrusted, which is why `dates.ts` guards every field it reads. (2026-09-16,
#3)

## items-decision-6: A non-uuid id is refused before Postgres sees it

Postgres rejects a non-uuid with an error that reaches the user as a 500, which
reads like the app is broken rather than like a bad link. The pages turn it into
a 404; the queries throw, because every screen posts ids it just rendered and
getting there means a replayed request. (2026-09-16, #3)

## items-decision-7: `getItem` is cached for the request

The edit page asks for the same row twice, once for the tab title and once for
the form, and Next only dedupes `fetch`. (2026-09-16, #3)

## items-decision-8: One list of weekday names

`WEEKDAY_NAMES` in `src/lib/items.ts`, 0 = Sunday, is the only one; the form
shows the same seven, shortened. The form and the list page each kept their own
seven days, and starting the week on Monday in one would have shown "Monday,
Friday" for the boxes ticked as Sunday and Thursday. (2026-09-16, #3)
