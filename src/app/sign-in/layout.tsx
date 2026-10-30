import { Card, CardContent } from "@/components/ui/card"
import { HabitGrid } from "./habit-grid"

// Sign-in and its error page are always dark, whatever the phone is set to:
// the `dark` class switches shadcn's tokens for everything inside. Each page
// fills the card.
export default function SignInLayout({ children }: LayoutProps<"/sign-in">) {
  return (
    <div className="dark relative flex min-h-dvh flex-1 items-center justify-center overflow-hidden bg-[oklch(0.13_0.04_300)] p-4 text-foreground">
      <HabitGrid />
      <Card className="relative w-full max-w-sm shadow-2xl shadow-black/50">
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  )
}
