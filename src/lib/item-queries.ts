/**
 * Every read and write of the `items` table. Server only: the only importers
 * are server components and server actions.
 *
 * The validation these take their input from is in `items.ts`; keeping the two
 * apart is what lets the parsing be tested without a database.
 */
import { cache } from "react"
import { asc, eq, isNull } from "drizzle-orm"
import { db } from "@naeemba/next-starter/db"
import { isItemId, type ItemInput } from "./items"
import { items, type Item } from "./schema"

/** Active items, in the order the list shows them. */
export function listItems(): Promise<Item[]> {
  return db.select().from(items).where(isNull(items.archivedAt)).orderBy(asc(items.name))
}

/**
 * Cached for the request: the edit page asks for the same row twice, once to
 * title the tab and once to fill the form. Next only dedupes `fetch`, so
 * without this every visit runs the same select twice.
 */
export const getItem = cache(async (id: string): Promise<Item | undefined> => {
  if (!isItemId(id)) return undefined
  const [item] = await db.select().from(items).where(eq(items.id, id)).limit(1)
  return item
})

export async function createItem(input: ItemInput): Promise<void> {
  await db.insert(items).values(input)
}

/** Both writers take their id from a URL, so both check it the same way. */
function existing(id: string) {
  if (!isItemId(id)) throw new RangeError("That item no longer exists.")
  return eq(items.id, id)
}

export async function updateItem(id: string, input: ItemInput): Promise<void> {
  await db.update(items).set(input).where(existing(id))
}

export async function deleteItem(id: string): Promise<void> {
  await db.delete(items).where(existing(id))
}
