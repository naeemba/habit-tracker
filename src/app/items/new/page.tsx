import Link from "next/link"
import { ItemForm } from "../item-form"

export const metadata = { title: "New item" }

export default function NewItemPage() {
  return (
    <main className="mx-auto w-full max-w-md flex-1 space-y-6 p-4">
      <Link href="/items" className="text-sm opacity-70">← Items</Link>
      <h1 className="text-2xl font-semibold tracking-tight">New item</h1>
      <ItemForm />
    </main>
  )
}
