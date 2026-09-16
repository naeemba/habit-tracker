import { SignInPage } from "@naeemba/next-starter/pages/sign-in"
import { authClient } from "@/lib/auth-client"

export default function Page() {
  return (
    <SignInPage
      authClient={authClient}
      errorCallbackUrl="/sign-in/error"
      passkey
    />
  )
}
