import { SignInErrorPage } from "@naeemba/next-starter/pages/sign-in"
import { signInErrorClassNames } from "@/app/auth-styles"

export default function Page() {
  return <SignInErrorPage classNames={signInErrorClassNames} />
}
