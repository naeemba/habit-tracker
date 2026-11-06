# Today: hard rules

Where a rule is in `CLAUDE.md` it is one line there; this is what breaking it
looked like. The others come from the code and its history.

## today-rule-1: A tap never removes its own row

Anything checked off today stays listed for the rest of the day, so a mistap
can be untapped. Gym 3 per week, done Monday and Tuesday: on Wednesday the tap
that completed the week pushed the count to 3 and the row vanished from Today
under the finger that tapped it, with nothing left to untap (#2). A chore does
the same on its own: it leaves the due list the day it is done, which is why
Today is `todayRows` and not `dueItems` (#4). Not in `CLAUDE.md`.
