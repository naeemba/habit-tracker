# Points: decisions

Settled questions. Read the entry before re-litigating it.

## points-decision-1: Points are stored per day, not recomputed

A day's earnings are a row in `ledger`, not a sum recomputed on read, so raising
an item's points or changing its schedule cannot rewrite what an earlier day
paid. (2026-09-18, #5)

## points-decision-2: A day that owes nothing pays no bonus

Vacuously "everything owed is done" would hand out five points a day to someone
with no items at all, and turn a rest day into the same reward as a day the
user cleared. (2026-09-18, #5)

## points-decision-3: The ledger write sits above the query modules

The write first went inside `toggleCheckIn`, so the offline replay, the undo
and the reminder would not each have to remember it. It moved up to the actions
before merge: `ledger-queries.ts` had been selecting from items and check-ins
itself, so "every check-in" was written out twice, and a row limit added to one
copy would have left the ledger reading the whole table. Each query module now
owns one table, `writeLedgerDay` asks the other two for theirs, and every
caller of `toggleCheckIn` calls `writeLedgerDay` after it. (The body of #5 still
describes the first version.) (2026-09-18, #5)

## points-decision-4: Archived items are paid, not owed

An archived item keeps the points of the days it was done and stops being owed.
Archiving instead of deleting is meant to keep history intact, and a bonus an
archived item could still block would never be earned again. (2026-09-18, #5)

## points-decision-5: A check-in and its ledger row are two commits

`toggleToday` runs `toggleCheckIn` and then `writeLedgerDay` as two commits,
and nothing in the app writes a past day. When that stops being acceptable,
give both daos a `tx` parameter and wrap the pair in one `db.transaction`.
(2026-09-18, #5)

## points-decision-6: Today's header reads the ledger row

Not a second sum on the page, so the header reports what the day actually paid,
bonus included, and cannot disagree with it. (2026-09-18, #5)
