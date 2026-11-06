# Deployment

How the app is built, run on a laptop and deployed. Production is two
containers on Coolify: this app, built from the `Dockerfile` with Next's
standalone output, and Coolify's one-click Postgres service, whose backup
feature covers the database. Locally `docker-compose.yml` runs the same
database, and can run the app container against it.

Most of what is here exists because of `@naeemba/next-starter`: what it
forces, what it does not give, and two things it does not handle for a
containerised deploy. Why the stack is what it is lives in
[decisions.md](decisions.md).

## The image

The starter ships no Dockerfile, so one is written here: Next standalone output
and a non-root user (`nextjs`, uid 1001).

- `deps` runs `npm ci`; `builder` runs `npm run build`; `runner` copies
  `.next/standalone` and `.next/static` and nothing else, so the runtime image
  needs no npm install of its own.
- `createAuth()` validates its environment at import time, and `next build`
  imports it while collecting route config, so a build with no secrets fails.
  The builder stage sets throwaway `DATABASE_URL`, `BETTER_AUTH_SECRET` and
  `BETTER_AUTH_URL`. They never reach the runtime image, which reads the real
  values from the environment, and none are `NEXT_PUBLIC_*`, so nothing is baked
  into the client bundle. The starter should skip validation when `NEXT_PHASE`
  says it is a production build.
- There is no `public/` copy: the directory does not exist yet, and `COPY`
  fails the build on a missing source. Add the line back with the first real
  public asset.
- Port and domain are set in Coolify.

## Runtime peers and the file tracer

The starter reaches its optional peers in ways the bundler cannot see — some
through `import()` calls marked `turbopackIgnore`, others through a require of a
variable string — so `output: "standalone"` never traces them. `next.config.ts`
walks their dependency tree and feeds it to the tracer through
`outputFileTracingIncludes`, keyed on every route, because any server component
that calls `getSession` pulls the same peers in. Without that the container
boots and then fails on the first sign-in request
([deployment-rule-1](hard-rules.md#deployment-rule-1-runtime-peers-ship-through-the-tracer-list)).
The starter should export these globs itself, next to the hidden imports, so the
list cannot drift.

- `runtimePeers` lists `@naeemba/next-starter`, `postgres`, `better-auth`,
  `@better-auth/passkey`, `resend`, `@react-email/components` and
  `@react-email/render`. `better-auth` is on it even though the starter imports
  it statically: the bundler inlines it into the server chunk, but
  `@better-auth/passkey` loads it by name at runtime and needs it on disk too.
- The walk follows Node's own lookup, nearest `node_modules` first and then up
  the tree, and stops at the project root. npm nests a package whenever two
  dependents need different versions, and the nested copy is the one its parent
  loads.
- `optionalPeers` (`resend` and the two `@react-email` packages) are the only
  peers allowed to be missing. It is not the starter's `peerDependenciesMeta`,
  which also marks `postgres` and `@better-auth/passkey` optional; this app
  depends on both, so a missing one has to fail the build. Any other peer that
  does not resolve fails the build by name.
- After the walk, the build fails unless the closure holds `postgres`,
  `@naeemba/next-starter` and `drizzle-orm`.

`next.config.ts` also sets `agentRules: false`: `next dev` otherwise appends
its own block to `CLAUDE.md` on every run, so the file shows up modified in
every diff.

## Migrations on deploy

The starter's README prescribes a `prestart` npm script for the auth
migrations. A standalone image runs `node server.js` directly and never goes
through npm, so the hook would never fire. The container's `CMD` runs
`next-starter migrate` before the server instead
([deployment-rule-2](hard-rules.md#deployment-rule-2-the-container-migrates-both-tracks-before-the-server)).
Two consequences worth knowing:

- The CLI has to be *in* the image, and nothing in app code imports it, so
  `@naeemba/next-starter` is on the `runtimePeers` list in `next.config.ts`
  purely to drag `bin/` and `migrations/` through the file tracer.
- `DATABASE_URL` must be set at container start, not just at build. Coolify
  supplies it from the Postgres service; `docker-compose.yml` does the same
  and waits on the database's healthcheck.

Both tracks are idempotent, so steady-state deploys take a no-op hit.

### Two tracks, not one

The starter owns the auth tables and journals them in
`__next_starter_migrations`. This app's own tables are a second, independent
track: `drizzle.config.ts` and `drizzle-kit generate` write the SQL into
`drizzle/`, and `scripts/migrate.mjs` applies it. The container's `CMD` runs
the auth track first, because this app's tables may reference `user(id)`, then
this one, then the server.

- The script uses drizzle-orm's migrator rather than drizzle-kit
  ([deployment-decision-5](decisions.md#deployment-decision-5-the-app-migrates-with-drizzle-orms-migrator)).
- `drizzle/` and `scripts/migrate.mjs` are on their own include list in
  `next.config.ts`. No route imports either one, so the file tracer never sees
  them. The build fails if either path is missing, because a glob that matches
  nothing is otherwise silent. It cannot catch a migration that was generated
  and never committed.
- `drizzle.config.ts` reads every file in `src/lib/schema/` as a glob, so a new
  table is a new file and nothing else.
- Locally, `npm run db:generate` after a schema change and `npm run db:migrate`
  to apply both tracks.

### Pages that read the database

Pages that read these tables cannot be prerendered: the build image has no
database, only the placeholder `DATABASE_URL`. `/` and `/items` set
`export const dynamic = "force-dynamic"` for that reason, and so must every
page added later that reads at render time
([deployment-rule-3](hard-rules.md#deployment-rule-3-a-page-that-reads-the-database-is-force-dynamic)).

## Local development

Needs Node 22.18+ and Docker; `engines` in `package.json` says the same, so npm
warns at install time. 22.18 is where Node runs TypeScript without a flag, which
`npm test` and `npm run db:backfill-ledger` rely on.

- `docker compose up -d db` publishes Postgres 17 on port 5435, not 5432: 5432
  on the development machine is taken by a native Postgres install. Inside the
  compose network the app still reaches it on 5432. `docker-compose.yml` is the
  one place that explains the port; `.env.example` and the root `README.md`
  point there.
- `docker compose up -d --build` runs the app container the way it is deployed.
  It refuses to start without `BETTER_AUTH_SECRET` in `.env`.
- `.env.example` names every environment variable. No secrets in committed
  files.

## Held versions and overrides

`package.json` cannot carry comments, so the reasons live here. Read this
before bumping anything
([deployment-rule-4](hard-rules.md#deployment-rule-4-read-the-held-versions-before-a-bump));
each entry says what would let it go.

| Entry | Why | Drop or bump when |
|---|---|---|
| `typescript` held at `~6.0.3` | typescript-eslint accepts `<6.1.0`; on TS 7 lint stops with `typescript-eslint does not support TS 7.0` | typescript-eslint supports TS 7 |
| `@types/node` held at `^22` | The image runs `node:22-alpine`. Newer types let code compile against APIs that throw `is not a function` in the container, and nothing in tsc, lint, tests or the build catches it | The `Dockerfile` base image moves to a newer Node; bump both together |
| Override `@esbuild-kit/core-utils` → `esbuild ^0.25.12` | drizzle-kit 0.31 still pulls `@esbuild-kit/core-utils`, which pins `esbuild ~0.18.20` ([GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99)) | drizzle-kit ships without `@esbuild-kit/core-utils` (1.0) |
| Override `minimatch@^10` → `^11.0.3` | eslint 10 and typescript-eslint 8 ask for `^10.2.x`, and no 10.x release fixes [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) | eslint and typescript-eslint depend on minimatch 11 themselves |

## Files

Folders: `drizzle/`.

- The image: `Dockerfile`, `.dockerignore`
- Local stack and environment: `docker-compose.yml`, `.env.example`, `.gitignore`
- Build and tracer: `next.config.ts`
- The app's migration track: `drizzle.config.ts`, `scripts/migrate.mjs`,
  `drizzle/0000_nifty_grey_gargoyle.sql`, `drizzle/0001_mature_mantis.sql`,
  `drizzle/0002_serious_paper_doll.sql`, `drizzle/meta/` (generated)
- Toolchain: `package.json`, `package-lock.json`, `tsconfig.json`,
  `eslint.config.mjs`, `postcss.config.mjs`

## Scenarios

- Given `drizzle/` or `scripts/migrate.mjs` is missing, when `next build` runs,
  then it fails saying the container would start and then fail on the first
  items page.
- Given a name in `runtimePeers` that does not resolve and is not an optional
  peer, when `next build` runs, then it fails with `Cannot resolve "<name>"`.
- Given `resend` is not installed, when `next build` runs, then the walk skips
  it and the build goes on.
- Given an empty database, when the container starts, then it runs the
  starter's migrations, then `scripts/migrate.mjs`, then the server.
- Given `DATABASE_URL` is unset, when `scripts/migrate.mjs` or `drizzle-kit`
  runs, then it stops with `DATABASE_URL is not set. See .env.example.`
- Given `.env` has no `BETTER_AUTH_SECRET`, when `docker compose up` starts the
  app, then compose refuses with `set BETTER_AUTH_SECRET in .env`.

## Open questions

- There is no CI. The tests, lint and build run only when someone runs them,
  which is also why nothing enforces the semicolon rule
  ([conventions-rule-3](../conventions/hard-rules.md#conventions-rule-3-no-semicolons)).
- Both starter workarounds (the hidden peers and import-time validation) are
  better fixed upstream; until then `next.config.ts` and the `Dockerfile` carry
  them.
- Five moderate `npm audit` findings remain, all
  [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) in
  minimatch 3.1.5 under `eslint-plugin-import`, `eslint-plugin-jsx-a11y` and
  `eslint-plugin-react`. An override cannot reach them: those plugins call
  `require("minimatch")` as a function, which minimatch 11 does not export, so
  lint would crash. Dev-only; it needs an attacker-controlled glob, and the
  globs come from this repo's own config (#7).
