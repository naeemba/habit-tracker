// Form controls shared by the item form and the auth pages, so a restyle in one
// place reaches both.

export const fieldClassName = "w-full rounded-lg border border-black/15 dark:border-white/20 bg-transparent px-3 py-2 text-base"
export const labelClassName = "block text-sm font-medium mb-1"
export const primaryButtonClassName = "w-full rounded-lg bg-foreground px-4 py-3 text-base font-medium text-background disabled:opacity-50"
export const errorClassName = "rounded-lg bg-red-50 dark:bg-red-950 px-3 py-2 text-sm text-red-700 dark:text-red-300"
// The big call to action on the auth pages, and the quieter choice beside it.
export const accentButtonClassName = "w-full rounded-xl bg-indigo-600 px-4 py-4 text-lg font-medium text-white shadow-sm active:bg-indigo-700 disabled:opacity-50"
export const secondaryButtonClassName = "w-full rounded-xl border border-black/15 px-4 py-3 text-base font-medium disabled:opacity-50 dark:border-white/20"
