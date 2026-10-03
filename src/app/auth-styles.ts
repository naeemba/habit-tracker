// The starter's auth forms draw their own buttons and inputs and take only
// class names, so they wear shadcn's styles as strings rather than its
// components. Sized up from shadcn's defaults so each control is a thumb's
// width on a phone.

import { buttonVariants } from "@/components/ui/button"
import { inputClassName } from "@/components/ui/input"
import { labelClassName } from "@/components/ui/label"
import { cn } from "@/lib/utils"

const primaryButton = cn(buttonVariants({ size: "lg" }), "h-11 w-full text-base")
const outlineButton = cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 w-full text-base")
const root = "flex flex-col gap-4"
const error = "rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
const success = "rounded-lg bg-muted px-3 py-2 text-sm"

// Sign-in and its error page sit inside the layout's Card, so their own
// wrapper only lays out what is in it.
export const insideCard = root
export const cardHeading = "font-heading text-lg font-medium"

export const signInFormClassNames = {
  root,
  passkeyButton: primaryButton,
  divider: "flex items-center gap-3",
  dividerLine: "h-px flex-1 bg-border",
  dividerLabel: "text-xs text-muted-foreground",
  emailLabel: cn(labelClassName, "mb-2"),
  emailInput: cn(inputClassName, "h-11 text-base md:text-base"),
  // The label, input and button sit in their own <form>, out of reach of the
  // root's gap, so the button carries its own spacing.
  submitButton: cn(outlineButton, "mt-3"),
  error,
  sentMessage: success,
}

export const signInErrorClassNames = {
  main: insideCard,
  heading: cardHeading,
  message: "text-sm text-muted-foreground",
  link: outlineButton,
}

// The passkey page is reached signed in, has no backdrop, and follows the
// phone's light or dark setting.
export const passkeyManagerClassNames = {
  main: "mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 p-4",
  heading: "text-2xl font-semibold tracking-tight",
  description: "text-sm text-muted-foreground",
  root,
  button: primaryButton,
  success,
  error,
}
