/**
 * Every read and write of the `items` table. Server only: the only importers
 * are server components and server actions.
 *
 * The validation these take their input from is in `items.ts`; keeping the two
 * apart is what lets the parsing be tested without a database.
 */
import { asc, eq, isNull } from "drizzle-orm"
import { db } from "@naeemba/next-starter/db"
import { isItemId, type ItemInput } from "./items"
import { items, type Item } from "./schema"

/** Active items, in the order the list shows them. */
export function listItems(): Promise<Item[]> {
  return db.select().from(items).where(isNull(items.archivedAt)).orderBy(asc(items.name))
}

export async function getItem(id: string): Promise<Item | undefined> {
  if (!isItemId(id)) return undefined
  const [item] = await db.select().from(items).where(eq(items.id, id)).limit(1)
  return item
}

export async function createItem(input: ItemInput): Promise<void> {
  await db.insert(items).values(input)
}

export async function updateItem(id: string, input: ItemInput): Promise<void> {
  if (!isItemId(id)) throw new RangeError("That item no longer exists.")
  await db.update(items).set(input).where(eq(items.id, id))
}

export async function deleteItem(id: string): Promise<void> {
  if (!isItemId(id)) throw new RangeError("That item no longer exists.")
  await db.delete(items).where(eq(items.id, id))
}
