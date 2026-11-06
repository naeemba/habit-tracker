# Schedules: hard rules

Where a rule is in `CLAUDE.md` it is one line there; this is what breaking it
looked like. The others come from the code and its history.

## schedules-rule-1: Bad data throws, it never reads as "not due"

A malformed date, a zero interval or a bad schedule used to end in `NaN` or
`false`, and both read as "not due" everywhere: the item stopped appearing on
Today, stopped costing the bonus, and nothing was logged. Seen, one at a time
(#2): a `per_week` count of 0, missing or `"three"` dropped gym off Today for
good; a weekday list posted by the form as `["1","3","5"]` passed
`Array.isArray` and matched no day; a weekdays schedule with no `days` threw a
`TypeError` from inside `includes` naming neither the item nor the field; a
check-in dated `2026-9-01` sorted after `2026-09-16`, read as a future
check-in, and the chore came back never-done, stuck at the top of Today; and a
garbage timestamp was reported as a bad timezone that was perfectly fine. Not
in `CLAUDE.md`.

## schedules-rule-2: A due context has no optional fields

With the fields optional, forgetting the week's count made every 3-times-a-week
habit show up on Today all seven days, and nothing errored. A forgotten
last-done date reads as "never done", which looks exactly like "due" (#2). Not
in `CLAUDE.md`.

## schedules-rule-3: Owed is not listed

The daily bonus and the Today header ask `requiredToday`, never `isDue`. When
the bonus asked `isDue`: gym 3 per week, pushups daily, Monday morning. The user
did the pushups and planned the gym for Tuesday, and lost 5 points for a day
they got right; the same on Tuesday and Wednesday, so the weekly habit became a
daily one for bonus purposes (#2). When the header counted listed rows, it said
"1 left" on a day the user owed nothing (#4). Not in `CLAUDE.md`.
