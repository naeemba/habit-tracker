# Stack Decision

Decided 2026-09-16. Not yet implemented.

## Choice

Next.js on top of `@naeemba/next-starter`
(`~/workspace/personal/next-typescript-starter`, published as a versioned npm
package). Postgres as the database.

## Why Next over SvelteKit

SvelteKit ships less JavaScript to the phone (roughly 15 KB runtime versus
90 KB), but on a modern Android phone the difference is not noticeable.
Existing Next projects, Coolify setups, and agent rules already exist for
Next. Familiarity wins for a personal app maintained for years.

## Why the starter

| Starter piece | What it replaces |
|---|---|
| Better Auth with `singleAdmin: "<email>"` | The "one password" login ticket |
| Passkey sign-in | Fingerprint unlock on the phone |
| Magic link (Resend) or Google | Backup sign-in |
| Drizzle ORM and migrations | Same ORM planned anyway |
| Next 16, React 19 | Current versions |

## What the starter forces

- **Postgres, not SQLite.** The starter's driver, `DATABASE_URL`, and
  migrations are Postgres-only. Coolify runs Postgres as a one-click service,
  so the deploy is two containers: app and database. Coolify's backup feature
  covers the database.
- `docs/data-model.md` stays as written; only column types change
  (`text` for uuid becomes `uuid`, dates stay `date`/`timestamptz`).

## What the starter does not give

- No Dockerfile. Write one with Next standalone output.
- No PWA, service worker, or Web Push. Add `serwist` and `web-push`.
- Passkeys need HTTPS and a stable domain. Fine on Coolify; use `localhost`
  in development.

## Libraries to add

| Need | Library |
|---|---|
| Service worker and offline cache | `serwist` |
| Push reminders | `web-push` (VAPID) |
| Offline outbox | IndexedDB via `idb`, or plain IndexedDB |
| Reminder scheduler | In-process interval in the Node server, checked every minute |
