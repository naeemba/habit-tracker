import Link from "next/link"
import { notFound } from "next/navigation"
import { getItem } from "@/lib/item-queries"
import { removeItem } from "../actions"
import { ItemForm } from "../item-form"

export async function generateMetadata({ params }: PageProps<"/items/[id]">) {
  const { id } = await params
  return { title: (await getItem(id))?.name ?? "Item" }
}

export default async function EditItemPage({ params }: PageProps<"/items/[id]">) {
  const { id } = await params
  const item = await getItem(id)
  if (!item) notFound()

  return (
    <main className="mx-auto w-full max-w-md flex-1 space-y-6 p-4">
      <Link href="/items" className="text-sm opacity-70">← Items</Link>
      <h1 className="text-2xl font-semibold tracking-tight">{item.name}</h1>

      <ItemForm item={item} />

      {/* Delete lives here and not on the list so a mistap on the phone cannot
          reach it. Archiving instead of deleting is its own card. */}
      <form action={removeItem.bind(null, item.id)} className="border-t border-black/10 dark:border-white/15 pt-4">
        <button type="submit" className="w-full rounded-lg border border-red-300 dark:border-red-800 px-4 py-3 text-base text-red-700 dark:text-red-400">
          Delete this item
        </button>
      </form>
    </main>
  )
}
