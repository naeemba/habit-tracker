# Sign-in

Getting the one user into the app and keeping everyone else out. All of it
comes from `@naeemba/next-starter`, which wraps Better Auth: this repository
holds only the shims its `init` scaffolded, the passkey name ("Habit Tracker"),
and which routes are gated.

## What the starter gives

| Starter piece | What it replaces |
|---|---|
| Better Auth with `singleAdmin: "<email>"` | The "one password" login ticket |
| Passkey sign-in | Fingerprint unlock on the phone |
| Magic link (Resend) or Google | Backup sign-in |

Google is left out (#1). Magic-link email needs `resend` and `@react-email/*`;
`next.config.ts` already lists those peers, so installing them needs no config
change. The auth tables belong to the starter, which migrates them through its
own CLI and journal (see [deployment](../deployment/README.md#two-tracks-not-one)).

Passkeys need HTTPS and a stable domain. Fine on Coolify; use `localhost` in
development. The relying party ID and origin default to `BETTER_AUTH_URL`'s
host.

## Two gates

The proxy (`proxy.ts`, the starter's `createProxy`) only checks that a session
cookie exists, and redirects a visitor with none on `/account/*` and `/items/*`.
The real gate is `requireSession()` at the top of every page and every server
action, because an action can be posted without going through any page
([sign-in-rule-1](hard-rules.md#sign-in-rule-1-every-page-and-action-checks-the-session)).
The proxy's matcher skips `_next/static`, `_next/image`, `favicon.ico` and
`/api/auth/`.

## Files

Folders: `src/app/sign-in/`, `src/app/account/`, `src/app/api/auth/`.

- The auth instance and its two sides: `src/lib/auth.ts`,
  `src/lib/auth-server.ts` (`getSession`, `requireSession`),
  `src/lib/auth-client.ts`
- The auth API: `src/app/api/auth/[...all]/route.ts`
- Pages from the starter: `src/app/sign-in/page.tsx`,
  `src/app/sign-in/error/page.tsx`, `src/app/account/passkeys/page.tsx`
- The cookie check: `proxy.ts`

## Scenarios

- Given no session cookie, when a visitor opens `/items` or `/account/passkeys`,
  then the proxy sends them to sign in.
- Given no session, when a visitor opens `/`, then `requireSession()` sends
  them to `/sign-in` (#7 checked this against the running image).
- Given no session, when a request posts an item or check-off action directly,
  then `requireSession()` refuses it before anything is written.
- Given a session, when the user opens `/account/passkeys`, then the starter's
  passkey manager renders.

## Open questions

- `singleAdmin` is commented out in `src/lib/auth.ts`, while the root
  `README.md` says sign-in is locked to one email and `CLAUDE.md` says single
  user. As it stands the magic link has no allowlist, and no domain table
  carries a user id, so a second account would see this user's tracker.
- Magic-link sign-in returns 500: `Optional peer '@react-email/render' is not
  installed` (#7). Without `RESEND_API_KEY` the starter falls back to printing
  the link in the container log.
- The root `README.md` lists Google sign-in; #1 left it out.
