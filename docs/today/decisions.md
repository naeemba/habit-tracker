# Today: decisions

Settled questions. Read the entry before re-litigating it.

## today-decision-1: The day comes from the server, never the form

A posted date would let a replayed request write a check-in on any day it
liked, and the daily bonus pays out per day. (2026-09-18, #4)

## today-decision-2: The whole row is one button

One tap anywhere on it, a target the width of the phone. Undo is the same tap
again: the second tap deletes the day's check-in and the ledger row is
rewritten behind it. (2026-09-18, #4)

## today-decision-3: The note appears only once the item is done

The note belongs to the check-in, so there is nothing to attach it to before
the tap, and it is folded away so it cannot sit between a thumb and the row.
(2026-09-18, #4)

## today-decision-4: The toggle race is accepted for now

Two overlapping taps on an already checked row can leave it checked with its
note gone: the first delete removes it, the second finds nothing and inserts a
fresh row. One user on one phone has to tap twice inside one round trip to hit
it, and the worst case is one lost note, so it is recorded rather than given a
transaction. The fix is for the button to post the state it saw instead of a
toggle, which is also what makes an offline queue safe to replay in any order;
do it when the offline queue lands. (2026-09-18, #4)

## today-decision-5: Every check-in is read, not a window

A chore's dueness is measured from the last time it was done, which can be
months back, and a `per_week` habit counts its week. One user tapping a handful
of items a day is a few thousand rows a year, so the whole table is cheaper
than working out how far back to look. Give `listCheckIns` a floor if it ever
gets slow. (2026-09-18, #4)

## today-decision-6: Check-ins are read once per render

`todayRows` filters with `isDue` over the contexts it already needs for the
chore hint, rather than asking `dueItems` to derive them a second time.
(2026-09-18, #4)
