import { HabitGrid } from "./habit-grid"

// Sign-in and its error page share the tinted backdrop; each page's <main>
// is the card on top of it.
export default function SignInLayout({ children }: LayoutProps<"/sign-in">) {
  return (
    <div className="relative flex min-h-dvh flex-1 items-center justify-center overflow-hidden bg-violet-950 p-4">
      <HabitGrid />
      {children}
    </div>
  )
}
