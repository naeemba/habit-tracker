"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createItem, deleteItem, updateItem } from "@/lib/item-queries"
import { parseItemForm, readSubmittedFields, type SubmittedFields } from "@/lib/items"

// ponytail: no session check here yet. Sign-in is its own card and the app is
// not deployed; wire `/items` into proxy.ts's `protect` list when it lands.

/** What the form shows when a save is refused. `null` means nothing to say. */
export type SaveResult = {
  error: string
  fields: SubmittedFields
  /** Counts refusals, so the form can tell one from the next. See item-form. */
  attempt: number
} | null

/**
 * Create when `id` is null, otherwise overwrite. One action for both so the
 * add form and the edit form cannot validate differently.
 */
export async function saveItem(
  id: string | null,
  previous: SaveResult,
  form: FormData,
): Promise<SaveResult> {
  let input
  try {
    input = parseItemForm(form)
  } catch (error) {
    // parseItemForm throws messages written for the user. Anything else is a
    // bug and should not be dressed up as advice.
    if (!(error instanceof RangeError)) throw error
    return { error: error.message, fields: readSubmittedFields(form), attempt: (previous?.attempt ?? 0) + 1 }
  }

  if (id === null) await createItem(input)
  else await updateItem(id, input)

  revalidatePath("/items")
  redirect("/items")
}

export async function removeItem(id: string): Promise<void> {
  await deleteItem(id)
  revalidatePath("/items")
  redirect("/items")
}
