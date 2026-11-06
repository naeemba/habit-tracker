# Points: hard rules

Where a rule is in `CLAUDE.md` it is one line there; this is what breaking it
looked like. The others come from the code and its history.

## points-rule-1: Never rewrite what a day already paid

A missed day costs only its bonus; points already earned are never taken back.
The first backfill handed every day with a check-in to `writeLedgerDay`, which
upserts. Re-running it after an item's points changed recomputed every old day
from today's items and overwrote what those days had paid out, the one thing
the ledger exists to stop (#5). Before the backfill, every day recorded before
the table existed had no row and counted as zero, which the reward total would
have reported as a plausible-looking number.

## points-rule-2: An item write rewrites today, and only today

Item writes move what today owes. Without the rewrite, tapping three of four
items and then deleting the fourth left the bonus unpaid until something else
was tapped, and adding an item after clearing the day left a bonus paid for a
day that was no longer clear (#5). Yesterday is history and keeps what it paid.
Not in `CLAUDE.md`.

## points-rule-3: A ledger failure never fails an item write

One item row with an unreadable schedule made `ledgerDay` throw after the item
write had already committed, so adding an item saved it and then showed an
error, and pressing Add again made a second copy (#5). `rewriteToday` logs and
swallows the throw; today's row is stale until the next write. Not in
`CLAUDE.md`.
