// The starter's auth pages ship with bare inline styles, and Tailwind's reset
// strips the browser's borders, so unstyled they show an invisible email box
// and buttons that read as plain text. These match the item form's controls.

import { accentButtonClassName, errorClassName, fieldClassName, labelClassName, secondaryButtonClassName } from "@/app/control-styles"

export const main = "mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-8 p-4"
const heading = "text-2xl font-semibold tracking-tight"
const root = "flex flex-col gap-4 text-left"
const success = "rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800 dark:bg-green-950 dark:text-green-300"

export const signInFormClassNames = {
  root,
  passkeyButton: accentButtonClassName,
  emailLabel: labelClassName,
  emailInput: `${fieldClassName} py-3`,
  // The label, input and button sit in their own <form>, out of reach of the
  // root's gap, so the button carries its own spacing.
  submitButton: `${secondaryButtonClassName} mt-3`,
  error: errorClassName,
  sentMessage: success,
}

export const signInErrorClassNames = {
  main,
  heading,
  message: "text-base opacity-80",
  link: `${secondaryButtonClassName} block text-center`,
}

export const passkeyManagerClassNames = {
  main,
  heading,
  description: "text-sm opacity-70",
  root,
  button: accentButtonClassName,
  success,
  error: errorClassName,
}
