# Habit Tracker

Personal habit and chore tracker with points toward a reward. Read
`README.md` for the full feature list; it is the source of truth for scope.
`docs/data-model.md` is the source of truth for tables and schedule
shapes. `docs/stack.md` records the stack choice and why. `docs/research.md` holds the formulas (strength score, dueness)
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

- Stack: Next.js on `@naeemba/next-starter` with Postgres. See
  `docs/stack.md`. Deploys on Coolify as app container plus Postgres service.
- No secrets in committed files. Read from environment, document names
  in `.env.example`.
- Work is tracked in `.dashboard/board.json`. Move a card to Doing before
  the first edit, to Done when the PR is ready.
- No semicolons in TypeScript or config files. Nothing enforces it yet; add
  Prettier with `"semi": false` when the repo gets a CI job to hang it on.
- `allowImportingTsExtensions` is on so `node --test` can resolve
  `./dates.ts`. Modules under `src/lib` that a test imports need the `.ts`
  extension on their own relative imports too — Node resolves the whole chain,
  not just the entry. `next build` and the Docker build both handle that.
  Nothing under `src/app` may use it: it compiles and then breaks at
  `next build`.
- Every relative import inside `src/lib` carries the `.ts` extension, whether a
  test reaches it or not. Two spellings in one folder drift, and the next
  person copies whichever file they opened first.
- A check-in and its ledger row are not written atomically. `toggleToday` runs
  `toggleCheckIn` and then `writeLedgerDay` as two commits, so a crash between
  them leaves that day checked off but unpaid, and only a later tap on the same
  day fixes it — nothing in the app writes a past day. Give both daos a `tx`
  parameter and wrap the pair in one `db.transaction` when that stops being
  acceptable.
- One `pgTable` per file under `src/lib/schema`, named after the table.
  `drizzle.config.ts` reads them as a glob, so a new table is a new file and
  nothing else.
