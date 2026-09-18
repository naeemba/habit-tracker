"use server"

import { revalidatePath } from "next/cache"
import { requireSession } from "@/lib/auth-server"
import { saveCheckInNote, toggleCheckIn } from "@/lib/checkin-queries"
import { today } from "@/lib/dates"
import { writeLedgerDay } from "@/lib/ledger-queries"
import { timezone } from "@/lib/settings"
import { parseNote } from "@/lib/today"

// The proxy only checks that a session cookie exists, and an action can be
// posted without going through any page, so both of these re-check.

/**
 * One tap: check the item off for today, or take it back.
 *
 * The day comes from the server's clock and the timezone setting, never from
 * the form. A posted date would let a replayed request write a check-in on any
 * day it liked, and the ledger (card a871063d) pays out per day.
 */
export async function toggleToday(form: FormData): Promise<void> {
  await requireSession()
  const localDate = today(timezone())
  await toggleCheckIn(String(form.get("itemId")), localDate)
  // A tap that earned its points but left the ledger alone would be worth
  // nothing, so the two always travel together.
  await writeLedgerDay(localDate)
  revalidatePath("/")
}

/** The optional note on today's check-off. Saving a blank one clears it. */
export async function saveTodayNote(form: FormData): Promise<void> {
  await requireSession()
  await saveCheckInNote(String(form.get("itemId")), today(timezone()), parseNote(form.get("note")))
  revalidatePath("/")
}
