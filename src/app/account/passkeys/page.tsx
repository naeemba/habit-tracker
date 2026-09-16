import { PasskeyManagerPage } from "@naeemba/next-starter/pages/passkey-manager"
import { authClient } from "@/lib/auth-client"
import { requireSession } from "@/lib/auth-server"

// The proxy only checks that a session cookie exists; this is the real gate.
// Without it a logged-out visitor gets the page and a working "Add a passkey"
// button, and only finds out after the fingerprint prompt that it will fail.
export default async function Page() {
  await requireSession()
  return <PasskeyManagerPage authClient={authClient} />
}
