# Deployment: hard rules

Where a rule is in `CLAUDE.md` it is one line there; this is what breaking it
looked like. The others come from the code and its history.

## deployment-rule-1: Runtime peers ship through the tracer list

The starter hides its optional peers from the bundler, so only the
`runtimePeers` walk in `next.config.ts` puts them in the image. Without it the
container started and then returned 500 on the first sign-in request, with
`Optional peer 'postgres' is not installed` (#1). Two earlier versions of the
walk failed the same way, later: it read `node_modules/<name>` and shipped the
hoisted `@better-auth/utils` 0.4.2 while `better-call` loads its nested 0.5.0,
and it swallowed every error, so a typo in the peer list built green and died
on the first sign-in. Not in `CLAUDE.md`.

## deployment-rule-2: The container migrates both tracks before the server

A fresh Postgres has no tables, and `node server.js` bypasses npm scripts. A
first deploy against an empty database served `/` fine and then failed the
first sign-in with `relation "user" does not exist`, with no CLI on disk to fix
it by hand (#1). One track further along: with drizzle-kit's `out` directory
renamed, `./drizzle/**/*` matched nothing, the image built, the container
started, `/` served 200, and `/items` died on `relation "items" does not exist`
(#3). Not in `CLAUDE.md`.

## deployment-rule-3: A page that reads the database is force-dynamic

The build image has only the placeholder `DATABASE_URL`. A page that reads a
table and is prerendered makes `next build` inside Docker die on
`relation "items" does not exist`, so no image is built at all (#3). Not in
`CLAUDE.md`.

## deployment-rule-4: Read the held versions before a bump

`package.json` cannot say why `typescript` and `@types/node` are held, so the
next update pass sees them as stale. On TypeScript 7, typescript-eslint throws
`typescript-eslint does not support TS 7.0` and lint stops (#7). A newer
`@types/node` than the `node:22-alpine` image lets code compile against APIs
that throw `is not a function` in the container, and nothing in tsc, lint,
tests or the build catches it.
