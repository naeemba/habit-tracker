# Sign-in: hard rules

Where a rule is in `CLAUDE.md` it is one line there; this is what breaking it
looked like. The others come from the code and its history.

## sign-in-rule-1: Every page and action checks the session

The proxy only sees that a cookie exists. When it protected `/admin/:path*`, a
route that was never built, a logged-out visitor could open
`/account/passkeys`, get the real page, click "Add a passkey" and work through
the browser's fingerprint prompt before the server rejected it. Before the
items screens called `requireSession()`, a logged-out `POST /items/<uuid>` with
the delete action deleted the row, and `GET /items` listed everything (#1, #3).
Not in `CLAUDE.md`.
