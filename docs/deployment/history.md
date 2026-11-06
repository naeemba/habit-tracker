# Deployment: history

One line per merged change: date, pull request, why.

- 2026-09-16 #1 — Scaffold on next-starter with Postgres: compose on 5435, a standalone non-root image, the tracer walk and build-time placeholders, migrations in `CMD` (deployment-decision-1 to 4, deployment-rule-1, deployment-rule-2)
- 2026-09-16 #2 — Node 22.18 floor and `allowImportingTsExtensions`, so `node --test` runs TypeScript (conventions-rule-1)
- 2026-09-16 #3 — The app's own migration track, its include list, and a build that fails when the list matches nothing (deployment-decision-5, deployment-rule-2, deployment-rule-3)
- 2026-09-18 #4 — `drizzle.config.ts` reads the schema folder as a glob, one table per file; the `checkins` migration
- 2026-09-18 #5 — The `ledger` migration and `npm run db:backfill-ledger`
- 2026-11-01 #7 — Every dependency to latest, critical and high advisories cleared, two versions held and two overrides recorded (deployment-decision-6, deployment-rule-4)
- 2026-11-01 #9 — `@naeemba/next-starter` 0.13.1 for the sign-in open redirect fix
- 2026-11-04 #10 — `@naeemba/next-starter` 0.13.2 for the proxy and `stripTags` ReDoS fixes
