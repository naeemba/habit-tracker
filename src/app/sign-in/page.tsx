import { SignInForm } from "@naeemba/next-starter/pages/sign-in"
import { authClient } from "@/lib/auth-client"
import { main, signInFormClassNames } from "@/app/auth-styles"

export const metadata = { title: "Sign in" }

// Built from two SignInForms rather than the starter's SignInPage, because the
// page cannot fold the email form away. Passkey is the way in; the magic link
// is the fallback and stays behind a tap.
export default function Page() {
  return (
    <main className={main}>
      <header className="flex flex-col items-center gap-3 text-center">
        <span aria-hidden className="flex size-16 items-center justify-center rounded-2xl bg-indigo-600/10 text-3xl dark:bg-indigo-400/15">
          ✅
        </span>
        <h1 className="text-3xl font-semibold tracking-tight">Habit Tracker</h1>
        <p className="text-base opacity-70">Small steps, every day.</p>
      </header>

      <SignInForm
        authClient={authClient}
        passkey={{ label: "🔑  Sign in with passkey" }}
        magicLink={false}
        classNames={signInFormClassNames}
      />

      <details className="group text-center">
        <summary className="cursor-pointer list-none py-2 text-sm underline underline-offset-4 opacity-70 group-open:hidden">
          Email me a link instead
        </summary>
        <SignInForm
          authClient={authClient}
          errorCallbackUrl="/sign-in/error"
          classNames={signInFormClassNames}
        />
      </details>
    </main>
  )
}
