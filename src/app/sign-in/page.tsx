import { SignInPage } from "@naeemba/next-starter/pages/sign-in"
import { authClient } from "@/lib/auth-client"
import { signInClassNames } from "@/app/auth-styles"

export default function Page() {
  return (
    <SignInPage
      authClient={authClient}
      errorCallbackUrl="/sign-in/error"
      passkey
      classNames={signInClassNames}
    />
  )
}
