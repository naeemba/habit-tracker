import * as React from "react"
import { cn } from "cn"

// Exported for elements this component cannot wrap, like the starter's
// sign-in form, which draws its own <label>. No "use client" here: in a client
// module this string reaches a server page as a reference, not as text.
export const labelClassName =
  "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50"

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(labelClassName, className)}
      {...props}
    />
  )
}

export { Label }
