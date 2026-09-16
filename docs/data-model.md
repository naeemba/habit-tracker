# Data Model

Postgres (see `docs/stack.md`). Types below are written loosely; use `uuid`, `date`, and `timestamptz` in the real schema. One user, so no `user_id` on domain tables; Better Auth owns its own user tables. Dates are `YYYY-MM-DD` in the
user's timezone; instants are UTC ISO strings.

## items

| column | type | notes |
|---|---|---|
| id | text | uuid |
| kind | text | `habit` or `chore` |
| name | text | |
| icon | text | emoji |
| color | text | hex |
| points | integer | default 1 |
| schedule | text | JSON, see below |
| reminder_time | text | `HH:MM` or null |
| archived_at | text | null while active |
| created_at | text | |

Schedule JSON by kind:

```json
{ "type": "daily" }
{ "type": "weekdays", "days": [1, 3, 5] }          // 0 = Sunday
{ "type": "per_week", "count": 3 }
{ "type": "interval", "days": 14 }                 // chores only
```

## checkins

| column | type | notes |
|---|---|---|
| id | text | uuid, generated on the client (dedupes offline replays) |
| item_id | text | |
| local_date | text | day it counts for |
| done_at | text | UTC instant |
| note | text | nullable |

`UNIQUE(item_id, local_date)`.

## ledger

One row per day. Written when a check-in is added or removed, so points
are a fact, not a recomputation.

| column | type | notes |
|---|---|---|
| local_date | text | primary key |
| item_points | integer | sum of points for check-ins that day |
| bonus | integer | 5 when everything owed that day is done, else 0 |

Total points = sum over ledger minus redeemed goals.

## goals

| column | type | notes |
|---|---|---|
| id | text | |
| name | text | |
| target_points | integer | |
| image_url | text | nullable |
| created_at | text | |
| redeemed_at | text | null while active |
| carry_over | integer | 0/1, keep surplus points after redeem |

Only one goal may have `redeemed_at = null`.

## push_subscriptions

| column | type | notes |
|---|---|---|
| endpoint | text | primary key |
| keys | text | JSON `{p256dh, auth}` |
| created_at | text | |

## settings

Key/value: `timezone`, `daily_bonus` (default 5). Auth is handled by Better Auth, no password stored here.

## Derived on read (never stored)

- Due today: habit schedule matches the date, or chore
  `daysSinceLastDone >= intervalDays` (dueness >= 1). A `per_week` habit is due
  every day of its week until earlier days meet the count.
- Owed today (what the bonus checks): due today, minus a `per_week` habit whose
  remaining count still fits in the days left in the week. Gym 3 per week with
  none done is due on Monday but not owed; on Friday two are left and two days
  are left, so it is owed.
- Streak: walk back from today over due days.
- Strength score: Loop formula, see `research.md` section 1.
- Pace: `remaining / average points per day over last 14 days`.
