// The starter's auth pages ship with bare inline styles, and Tailwind's reset
// strips the browser's borders, so unstyled they show an invisible email box
// and buttons that read as plain text. These match the item form's controls.

import { errorClassName, fieldClassName, labelClassName, primaryButtonClassName } from "@/app/control-styles"

const main = "mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 p-4"
const heading = "text-2xl font-semibold tracking-tight"
const root = "flex flex-col gap-4"
const secondaryButton = "w-full rounded-lg border border-black/15 px-4 py-3 text-base font-medium disabled:opacity-50 dark:border-white/20"
const success = "rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800 dark:bg-green-950 dark:text-green-300"

export const signInClassNames = {
  main,
  heading,
  root,
  passkeyButton: primaryButtonClassName,
  divider: "flex items-center gap-3",
  dividerLine: "h-px flex-1 bg-black/10 dark:bg-white/15",
  dividerLabel: "text-sm opacity-60",
  emailLabel: labelClassName,
  emailInput: fieldClassName,
  // The label, input and button sit in their own <form>, out of reach of the
  // root's gap, so the button carries its own spacing.
  submitButton: `${secondaryButton} mt-3`,
  error: errorClassName,
  sentMessage: success,
}

export const signInErrorClassNames = {
  main,
  heading,
  message: "text-base opacity-80",
  link: `${secondaryButton} block text-center`,
}

export const passkeyManagerClassNames = {
  main,
  heading,
  description: "text-sm opacity-70",
  root,
  button: primaryButtonClassName,
  success,
  error: errorClassName,
}
