import { createAuth } from "@naeemba/next-starter/auth"

// createAuth is async because optional ESM-only peers (e.g. @better-auth/passkey)
// must be loaded via dynamic import(). Top-level await is fine in Next 16
// server modules — `auth` is a resolved `Auth` instance to downstream importers.
export const auth = await createAuth({
  passkey: {
    rpName: "Habit Tracker",
    // rpID / origin default to BETTER_AUTH_URL's host.
  },
  // singleAdmin: "owner@example.com",  // optional: lock sign-in to one email
})
