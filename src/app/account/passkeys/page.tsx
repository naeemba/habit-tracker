import { PasskeyManagerPage } from "@naeemba/next-starter/pages/passkey-manager"
import { authClient } from "@/lib/auth-client"

export default function Page() {
  return <PasskeyManagerPage authClient={authClient} />
}
