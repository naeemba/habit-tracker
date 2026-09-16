import Link from "next/link"
import { requireSession } from "@/lib/auth-server"
import { listItems } from "@/lib/item-queries"
import { describeSchedule } from "@/lib/items"

export const metadata = { title: "Items" }

// The list is live data and the build image has no database to read, so it is
// never prerendered. Without this `next build` inside Docker dies on
// `relation "items" does not exist` against the placeholder DATABASE_URL.
export const dynamic = "force-dynamic"

export default async function ItemsPage() {
  // The proxy sees only that a cookie exists; this is the real gate.
  await requireSession()
  const items = await listItems()

  return (
    <main className="mx-auto w-full max-w-md flex-1 space-y-6 p-4">
      <h1 className="text-2xl font-semibold tracking-tight">Items</h1>

      {items.length === 0 ? (
        <p className="text-sm opacity-70">Nothing yet. Add your first habit or chore below.</p>
      ) : (
        <ul className="space-y-2">
          {items.map(item => (
            <li key={item.id}>
              <Link
                href={`/items/${item.id}`}
                className="flex items-center gap-3 rounded-xl border border-black/10 dark:border-white/15 p-3"
              >
                <span aria-hidden className="text-2xl">{item.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{item.name}</span>
                  <span className="block text-sm opacity-70">{describeSchedule(item.schedule)}</span>
                </span>
                <span
                  aria-hidden
                  className="size-3 shrink-0 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm tabular-nums opacity-70">{item.points}p</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/items/new"
        className="block rounded-xl border border-black/10 dark:border-white/15 p-3 text-center font-medium"
      >
        Add an item
      </Link>
    </main>
  )
}
