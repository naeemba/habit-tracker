# Habit Tracker

Personal habit and chore tracker with points toward a reward. Read
`README.md` for the full feature list; it is the source of truth for scope.
`docs/data-model.md` is the source of truth for tables and schedule
shapes. `docs/research.md` holds the formulas (strength score, dueness)
and the platform limits (iOS push, offline). Check it before inventing
an alternative.

## Product rules

- Target device is Android Chrome. Do not spend effort on iOS Safari quirks.
- Single user. No signups, no roles, no multi-tenancy.
- Chores use "every N days since last done". Habits use a fixed schedule.
  Do not merge the two into one schedule type.
- A missed day costs only the daily bonus. Never subtract earned points.
- Everything on the Today view must work with one tap on a phone.
- Offline first: a check-off must succeed without network and sync later.

## Engineering rules

- Deploys as one Docker container on Coolify. Keep it to one service plus
  a database file or container.
- No secrets in committed files. Read from environment, document names
  in `.env.example`.
- Work is tracked in `.dashboard/board.json`. Move a card to Doing before
  the first edit, to Done when the PR is ready.
