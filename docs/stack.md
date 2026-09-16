# Stack Decision

Decided 2026-09-16. Scaffolded 2026-09-16.

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

- No Dockerfile. Written, with Next standalone output and a non-root user.
- No PWA, service worker, or Web Push. Add `serwist` and `web-push`.
- Passkeys need HTTPS and a stable domain. Fine on Coolify; use `localhost`
  in development.
- Two things the starter does not handle for a containerised deploy, both
  worked around here and both better fixed upstream:
  - Its optional peers are loaded in ways the bundler cannot see, so
    `output: "standalone"` does not trace them. `next.config.ts` walks
    their dependency tree and feeds it to the tracer. Without that the
    container boots and then fails on the first sign-in request. The
    starter should export these globs itself, next to the hidden imports.
  - `createAuth()` validates its environment at import time, and
    `next build` imports it while collecting route config, so a build with
    no secrets fails. The `Dockerfile` sets throwaway values in the builder
    stage. The starter should skip validation when `NEXT_PHASE` says it is
    a production build.

## Migrations on deploy

The starter's README prescribes a `prestart` npm script for the auth
migrations. A standalone image runs `node server.js` directly and never goes
through npm, so the hook would never fire. The container's `CMD` runs
`next-starter migrate` before the server instead. Two consequences worth
knowing:

- The CLI has to be *in* the image, and nothing in app code imports it, so
  `@naeemba/next-starter` is on the `runtimePeers` list in `next.config.ts`
  purely to drag `bin/` and `migrations/` through the file tracer.
- `DATABASE_URL` must be set at container start, not just at build. Coolify
  supplies it from the Postgres service; `docker-compose.yml` does the same
  and waits on the database's healthcheck.

Without this the first deploy against an empty database looks healthy — `/`
returns 200 — and then the first sign-in fails with `relation "user" does not
exist`, with no CLI on disk to fix it by hand.

### Two tracks, not one

The starter owns the auth tables and journals them in
`__next_starter_migrations`. This app's own tables are a second, independent
track: `drizzle.config.ts` and `drizzle-kit generate` write the SQL into
`drizzle/`, and `scripts/migrate.mjs` applies it. The container's `CMD` runs
the auth track first, then this one, then the server.

- The script uses drizzle-orm's migrator rather than drizzle-kit. drizzle-kit
  is a dev dependency and carries esbuild with it, so it is not in the
  production image; drizzle-orm already is, because the closure drags it in.
- `drizzle/` and `scripts/migrate.mjs` are on their own include list in
  `next.config.ts`. No route imports either one, so the file tracer never sees
  them, and an image without them repeats the trap one track along: `/` returns
  200 and the first items page dies on `relation "items" does not exist`.
- Locally, `npm run db:generate` after a schema change and `npm run db:migrate`
  to apply both tracks.

Pages that read these tables cannot be prerendered: the build image has no
database, only the placeholder `DATABASE_URL`. `/items` sets
`export const dynamic = "force-dynamic"` for that reason, and so must every
page added later that reads at render time.

## Libraries to add

| Need | Library |
|---|---|
| Service worker and offline cache | `serwist` |
| Push reminders | `web-push` (VAPID) |
| Offline outbox | IndexedDB via `idb`, or plain IndexedDB |
| Reminder scheduler | In-process interval in the Node server, checked every minute |
