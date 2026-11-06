# Settings

The two values that decide what the app shows: the timezone every local date is
measured in, and what the daily bonus is worth. Until there is a settings table
and a settings page to hold them, both live in `src/lib/settings.ts`, and the
page swaps the body of that file and nothing else; nothing else reads either
value.

## Timezone

`timezone()` returns `TIMEZONE` from the environment, documented in
`.env.example`. The fallback is the machine's own zone, which in the container is
UTC. A wrong zone rolls the day over at the wrong hour, so set `TIMEZONE` on any
deployment that is not on UTC: on Berlin time the day would roll over at 2am,
and a late tap would land on yesterday. An unknown zone throws
`Unknown timezone in settings.timezone` from the dates module.

## Daily bonus

`DAILY_BONUS` is 5. It is read at the moment a day's ledger row is written, so
changing it later never rewrites what an earlier day already paid out
([points](../points/README.md)).

## Files

- Both settings: `src/lib/settings.ts`

## Scenarios

- Given `TIMEZONE` is unset, when the app asks what day it is, then it uses the
  machine's zone.
- Given a day already written, when `DAILY_BONUS` changes, then that day's row
  keeps the bonus it paid.

## Open questions

- [data-model.md](../data-model.md) has a key/value `settings` table holding
  `timezone` and `daily_bonus` (default 5); the code reads an environment
  variable and a constant, and the table does not exist yet.
