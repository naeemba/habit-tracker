# Deployment: decisions

Settled questions. Read the entry before re-litigating it.

## deployment-decision-1: Next.js, not SvelteKit

Next.js on top of `@naeemba/next-starter`
(`~/workspace/personal/next-typescript-starter`, published as a versioned npm
package), with Postgres as the database. SvelteKit ships less JavaScript to the
phone (roughly 15 KB runtime versus 90 KB), but on a modern Android phone the
difference is not noticeable. Existing Next projects, Coolify setups, and agent
rules already exist for Next. Familiarity wins for a personal app maintained
for years. (2026-09-16, decided and scaffolded the same day, #1)

## deployment-decision-2: Build on the starter

| Starter piece | What it replaces |
|---|---|
| Better Auth with `singleAdmin: "<email>"` | The "one password" login ticket |
| Passkey sign-in | Fingerprint unlock on the phone |
| Magic link (Resend) or Google | Backup sign-in |
| Drizzle ORM and migrations | Same ORM planned anyway |
| Next 16, React 19 | Current versions |

What it does not give is written here instead: the Dockerfile, the file-tracer
include lists and the migrate step (see the [README](README.md)), and the PWA
and push libraries ([deployment-decision-7](#deployment-decision-7-libraries-for-what-is-not-built-yet)).
(2026-09-16, #1)

## deployment-decision-3: Postgres, not SQLite

The starter forces it: its driver, `DATABASE_URL`, and migrations are
Postgres-only. Coolify runs Postgres as a one-click service, so the deploy is
two containers, app and database, and Coolify's backup feature covers the
database. This supersedes the original plan of one container with SQLite on a
volume ([research notes](../research.md) section 7); it is still one
Dockerfile, non-root user, port and domain set in Coolify.
[data-model.md](../data-model.md) stays as written; only column types change
(`text` for uuid becomes `uuid`, dates stay `date`/`timestamptz`). (2026-09-16,
#1)

## deployment-decision-4: The container migrates, not a `prestart` script

The starter's README prescribes a `prestart` npm script. A standalone image runs
`node server.js` and never goes through npm, so the container's `CMD` runs
`next-starter migrate`, then the app's own track, then the server. (2026-09-16,
#1)

## deployment-decision-5: The app migrates with drizzle-orm's migrator

The starter owns the auth tables and its CLI has no extension point, so this
app's tables get their own track: `drizzle-kit generate` writes the SQL,
`scripts/migrate.mjs` applies it with drizzle-orm's migrator. drizzle-kit is a
dev dependency and carries esbuild with it, so it is not in the production
image; drizzle-orm already is, because the closure drags it in. (2026-09-16, #3)

## deployment-decision-6: Hold two versions, override two packages

When every dependency moved to its latest version, `typescript` stayed on the
6.0 line and `@types/node` on 22, and `esbuild` under
`@esbuild-kit/core-utils` and `minimatch@^10` were overridden. The reasons and
the condition for dropping each are in the
[held versions table](README.md#held-versions-and-overrides). The lockfile was
regenerated, because the old one pinned better-call 1.4.0, which
`@better-auth/passkey` 1.7.15's exact peer `1.4.4` refuses. (2026-11-01, #7)

## deployment-decision-7: Libraries for what is not built yet

The starter has no PWA, service worker, or Web Push. When those land:

| Need | Library |
|---|---|
| Service worker and offline cache | `serwist` |
| Push reminders | `web-push` (VAPID) |
| Offline outbox | IndexedDB via `idb`, or plain IndexedDB |
| Reminder scheduler | In-process interval in the Node server, checked every minute |

(2026-09-16)
