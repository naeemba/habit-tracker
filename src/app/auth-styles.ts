// The starter's auth pages ship with bare inline styles, and Tailwind's reset
// strips the browser's borders, so unstyled they show an invisible email box
// and buttons that read as plain text. These match the item form's controls.

import { errorClassName, fieldClassName, labelClassName, primaryButtonClassName, secondaryButtonClassName } from "@/app/control-styles"

// Full-page layout for the signed-in passkey page, which has no backdrop.
const main = "mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 p-4"
// The sign-in pages sit on the layout's tinted backdrop; this is the card on it.
const card = "relative flex w-full max-w-sm flex-col gap-6 rounded-2xl border border-black/5 bg-white p-6 shadow-xl shadow-indigo-950/10 dark:border-white/10 dark:bg-neutral-900"
const heading = "text-2xl font-semibold tracking-tight"
const root = "flex flex-col gap-4"
const success = "rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800 dark:bg-green-950 dark:text-green-300"

export const signInClassNames = {
  main: card,
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
  submitButton: `${secondaryButtonClassName} mt-3`,
  error: errorClassName,
  sentMessage: success,
}

export const signInErrorClassNames = {
  main: card,
  heading,
  message: "text-base opacity-80",
  link: `${secondaryButtonClassName} block text-center`,
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
