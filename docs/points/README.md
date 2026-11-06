# Points

What a day earns. Each completed item earns its points, and a day that clears
everything it owed earns a daily bonus of 5 on top. Both are written down per
day in the `ledger` table, so a day that paid out eight points paid out eight
points: raising an item's points or changing its schedule next month cannot
rewrite it. Points add up toward a reward; a missed day costs only that day's
bonus, never the points already earned.

## What a day earns

`ledgerDay` in `src/lib/ledger.ts`, given every item and every check-in:

- `item_points` is the sum of the points of the items checked off that day,
  summed over the items, so a check-in whose item row is gone is worth nothing
  instead of `NaN`.
- `bonus` is `DAILY_BONUS` ([settings](../settings/README.md)) when everything
  owed that day is done, else 0. Owed is `requiredItems`, not `dueItems`
  ([schedules-rule-3](../schedules/hard-rules.md#schedules-rule-3-owed-is-not-listed)).
  A day that owes nothing pays no bonus.
- Archived items keep the points of the days they were done and stop being
  owed.

## When a row is written

- On every check-in change: `toggleToday` calls `writeLedgerDay` after
  `toggleCheckIn`, and so must every later caller (the offline replay, the
  undo). `writeLedgerDay` reads every item and every check-in through the
  item and check-in queries, works the day out and upserts its row.
- On every item save or delete, for today only
  ([points-rule-2](hard-rules.md#points-rule-2-an-item-write-rewrites-today-and-only-today)).
  `rewriteToday` logs and swallows a failure
  ([points-rule-3](hard-rules.md#points-rule-3-a-ledger-failure-never-fails-an-item-write)).
- Once, by hand, for the days recorded before the table existed:
  `npm run db:backfill-ledger` writes a row for every day that has check-ins and
  no row yet. Run it once after `db:migrate`; running it twice is a no-op.

Total points = sum over the ledger minus redeemed goals
([data-model.md](../data-model.md)). Today's header reads the day's row through
`pointsOn`, zero on a day with no row yet.

## Files

- What a day earns: `src/lib/ledger.ts`, `src/lib/ledger.test.ts`
- The `ledger` table and its reads and writes: `src/lib/schema/ledger.ts`,
  `src/lib/ledger-queries.ts`
- The one-off backfill: `scripts/backfill-ledger.ts`

## Scenarios

- Given two items checked off today, when the day is worked out, then
  `item_points` is the sum of their points.
- Given check-ins on other days, when today is worked out, then they do not
  count.
- Given everything owed today checked off, when the day is worked out, then the
  bonus is 5.
- Given an item due today and left undone, when the day is worked out, then the
  bonus is 0.
- Given a habit not scheduled today, or a chore not ripe yet, when it is left
  undone, then the bonus still lands.
- Given an overdue chore, or one never done, left undone, when the day is
  worked out, then the bonus is 0.
- Given a `per_week` habit with room left in the week, when it is left undone,
  then the bonus still lands; once the count left no longer fits, it costs the
  bonus.
- Given no item owed today, when the day is worked out, then the bonus is 0.
- Given an item archived after it was done, when that day is worked out, then
  its points still count; archived and undone today, it does not block the
  bonus.
- Given a check-in whose item is gone, when the day is worked out, then it is
  worth 0.
- Given days that already have a ledger row, when the backfill runs again, then
  those rows are left alone.

## Open questions

- A check-in and its ledger row are two commits. A crash between them leaves
  that day checked off but unpaid, and only a later tap on the same day fixes
  it ([points-decision-5](decisions.md#points-decision-5-a-check-in-and-its-ledger-row-are-two-commits)).
- The root `README.md` promises a ledger of points earned per day; nothing shows
  it beyond the Today header.
- The reward goal, its progress bar and its pace are not built; the `goals`
  table in [data-model.md](../data-model.md) does not exist yet.
