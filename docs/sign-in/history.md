# Sign-in: history

One line per merged change: date, pull request, why.

- 2026-09-16 #1 — Better Auth through next-starter, passkey named, Google left out; `/account` gated in the proxy and the page (sign-in-rule-1)
- 2026-09-16 #3 — The items screens and their actions behind a session (sign-in-rule-1)
- 2026-09-18 #4 — `auth-server.ts` imports `auth.ts` with its extension (conventions-rule-2)
- 2026-11-01 #9 — next-starter 0.13.1: `?callbackUrl=/%09/evil.com` no longer sends the user to an external site after sign-in, and `%2F` and `%5C` are rejected in the callback path
- 2026-11-04 #10 — next-starter 0.13.2: the proxy's trailing-slash ReDoS and the email `stripTags` ReDoS are fixed; `proxy.ts` uses `createProxy`, so it picks up the fix directly
