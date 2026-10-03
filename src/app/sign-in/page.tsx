import { SignInForm } from "@naeemba/next-starter/pages/sign-in"
import { authClient } from "@/lib/auth-client"
import { cardHeading, insideCard, signInFormClassNames } from "@/app/auth-styles"

export const metadata = { title: "Sign in" }

// The form alone rather than the starter's SignInPage: the layout's Card is
// the page, and the starter's <main> would nest a second one inside it.
export default function Page() {
  return (
    <div className={insideCard}>
      <h1 className={cardHeading}>Sign in</h1>
      <SignInForm
        authClient={authClient}
        errorCallbackUrl="/sign-in/error"
        passkey
        classNames={signInFormClassNames}
      />
    </div>
  )
}
