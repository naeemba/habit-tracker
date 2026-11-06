# Items

The habits and chores themselves: adding, editing, listing and deleting them.
An item has a name, an emoji icon, a colour, a points value (default 1), a
schedule and an optional reminder time. Habits have a fixed schedule (daily,
specific weekdays, N times a week); chores repeat a number of days after they
were last done. What each schedule means on a given day is in
[schedules](../schedules/README.md).

## The screens

- `/items` lists active items by name, each with its icon, colour, schedule in
  words and points. It is the only way to reach an item.
- `/items/new` and `/items/<id>` share one form, so add and edit cannot
  validate differently. Every schedule's fields stay on screen whatever is
  selected, so the form needs no JavaScript of its own; the action reads only
  the fields of the schedule that was picked.
- Delete lives on the item's own page, not on the list, so a mistap on the
  phone cannot reach it. It is a hard delete for now, and takes the item's
  check-ins with it ([today](../today/README.md)).

## Saving an item

`parseItemForm` in `src/lib/items.ts` is the only door into the table, and
checks every field server-side; the browser's `required` and `maxLength` are a
convenience, since a form can be replayed with anything in it.

| Field | Accepted |
|---|---|
| Name | trimmed, 1 to 80 characters |
| Icon | trimmed, 1 to 16 characters |
| Colour | `#a1b2c3` shape |
| Points | whole number 0 to 999 |
| Schedule | one of the four types; at least one weekday 0-6, de-duplicated and sorted; 1 to 7 times a week; 1 to 365 days |
| Reminder time | blank, or `HH:MM` from `00:00` to `23:59` |

`kind` is not on the form: an `interval` schedule makes a chore, anything else a
habit. A refused save returns the message with everything that was typed, and
the form redraws from it. Every save and delete then rewrites today's ledger row
([points](../points/README.md)).

Item ids come out of the URL, so only a uuid is looked up: anything else is a
404 on the page and a thrown error in the queries, never a Postgres 500.

`describeSchedule` prints a schedule in words for the list and the Today rows.
`schedule` is jsonb with no CHECK constraint, so a row typed into psql or
restored from a backup can hold anything; such a schedule prints "Schedule
needs fixing" and stays clickable
([items-rule-1](hard-rules.md#items-rule-1-the-list-never-throws-on-a-bad-row)).

## Files

Folders: `src/app/items/`.

- Parsing, describing and their tests: `src/lib/items.ts`,
  `src/lib/items.test.ts`
- The `items` table and its queries: `src/lib/schema/items.ts`,
  `src/lib/item-queries.ts`
- The screens: `src/app/items/page.tsx`, `src/app/items/new/page.tsx`,
  `src/app/items/[id]/page.tsx`, `src/app/items/item-form.tsx`
- Save and delete: `src/app/items/actions.ts`

## Scenarios

- Given a form with name "Gym", colour `#a1b2c3`, 3 points and a daily
  schedule, when it is saved, then it is a habit with no reminder.
- Given an interval schedule, when it is saved, then the item is a chore; a
  `per_week` schedule makes a habit.
- Given weekdays 5, 1 and 1 ticked, when saved, then the schedule holds
  `[1, 5]`.
- Given no weekday, or a weekday of 7, when saved, then it is refused with
  "Pick at least one weekday."
- Given 0 times a week or an interval of 0 or none, when saved, then it is
  refused.
- Given no schedule or an unknown one, when saved, then "Pick a schedule."
- Given a name of spaces, when saved, then "A name is required."; a name with
  spaces around it is trimmed.
- Given colour "red" or reminder "25:00", when saved, then it is refused.
- Given 0 points, when saved, then it saves; 1.5 or -1 is refused.
- Given a name of 81 characters or an icon of 17, when saved, then it is
  refused.
- Given a refused save, when the form comes back, then every typed field is
  still there.
- Given `/items/new`, when the id is checked, then it is not an item id.
- Given a row whose schedule is unreadable, when `/items` renders, then the row
  reads "Schedule needs fixing" and still links to its page.

## Open questions

- Delete is a hard delete; `archived_at` exists, and the list and the ledger
  already respect it, but nothing sets it yet.
- `reminder_time` is saved and nothing sends a reminder yet.
