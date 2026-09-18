import { test } from "node:test"
import assert from "node:assert/strict"
import { ledgerDay, type LedgerItem } from "./ledger.ts"
import { DAILY_BONUS } from "./settings.ts"
import type { CheckIn, Schedule } from "./dates.ts"

// A Wednesday, so a weekday habit on [3] is due and one on [1] is not.
const wednesday = "2026-09-16"
// The Friday of the same week: two days left counting itself.
const friday = "2026-09-18"

function item(id: string, points: number, schedule: Schedule, archivedAt: Date | null = null): LedgerItem {
  return { id, points, schedule, archivedAt }
}

function checkIn(itemId: string, localDate: string): CheckIn {
  return { itemId, localDate }
}

test("a day earns the points of what was checked off on it", () => {
  const items = [item("1", 3, { type: "daily" }), item("2", 5, { type: "daily" })]

  assert.deepEqual(ledgerDay(items, wednesday, [checkIn("1", wednesday)]), {
    localDate: wednesday,
    itemPoints: 3,
    bonus: 0,
  })
})

test("check-ins on other days do not count toward this one", () => {
  const items = [item("1", 3, { type: "daily" })]
  const checkIns = [checkIn("1", "2026-09-15"), checkIn("1", "2026-09-17")]

  assert.equal(ledgerDay(items, wednesday, checkIns).itemPoints, 0)
})

test("the bonus lands once everything owed that day is done", () => {
  const items = [item("1", 3, { type: "daily" }), item("2", 5, { type: "weekdays", days: [3] })]
  const checkIns = [checkIn("1", wednesday), checkIn("2", wednesday)]

  assert.deepEqual(ledgerDay(items, wednesday, checkIns), {
    localDate: wednesday,
    itemPoints: 8,
    bonus: DAILY_BONUS,
  })
})

test("an item due today and left undone costs the bonus", () => {
  const items = [item("1", 3, { type: "daily" }), item("2", 5, { type: "daily" })]

  assert.equal(ledgerDay(items, wednesday, [checkIn("1", wednesday)]).bonus, 0)
})

test("a habit not scheduled today cannot cost the bonus", () => {
  const items = [item("1", 3, { type: "daily" }), item("2", 5, { type: "weekdays", days: [1] })]

  assert.equal(ledgerDay(items, wednesday, [checkIn("1", wednesday)]).bonus, DAILY_BONUS)
})

test("a chore that is not ripe yet is not owed", () => {
  const items = [item("1", 3, { type: "daily" }), item("2", 5, { type: "interval", days: 14 })]
  const checkIns = [checkIn("1", wednesday), checkIn("2", "2026-09-14")]

  assert.equal(ledgerDay(items, wednesday, checkIns).bonus, DAILY_BONUS)
})

test("an overdue chore left undone costs the bonus", () => {
  const items = [item("1", 3, { type: "daily" }), item("2", 5, { type: "interval", days: 14 })]

  // Last done six weeks back, so it is well past due.
  assert.equal(ledgerDay(items, wednesday, [checkIn("1", wednesday), checkIn("2", "2026-08-01")]).bonus, 0)
  // Never done at all, which is infinitely overdue — the state a chore is in
  // the day it is added.
  assert.equal(ledgerDay(items, wednesday, [checkIn("1", wednesday)]).bonus, 0)
})

test("a per_week habit with room left in the week is not owed yet", () => {
  // Gym three times a week, nothing done, on a Wednesday: four days are left
  // and three are owed, so skipping today costs nothing.
  const items = [item("1", 3, { type: "daily" }), item("2", 5, { type: "per_week", count: 3 })]

  assert.equal(ledgerDay(items, wednesday, [checkIn("1", wednesday)]).bonus, DAILY_BONUS)
})

test("a per_week habit that no longer fits in the days left is owed", () => {
  // Same gym on the Friday: two days left, two still to do.
  const items = [item("1", 3, { type: "daily" }), item("2", 5, { type: "per_week", count: 3 })]
  const checkIns = [checkIn("1", friday), checkIn("2", "2026-09-14")]

  assert.equal(ledgerDay(items, friday, checkIns).bonus, 0)
  assert.equal(ledgerDay(items, friday, [...checkIns, checkIn("2", friday)]).bonus, DAILY_BONUS)
})

test("a day that owes nothing pays no bonus", () => {
  assert.deepEqual(ledgerDay([], wednesday, []), { localDate: wednesday, itemPoints: 0, bonus: 0 })

  const weekendOnly = [item("1", 3, { type: "weekdays", days: [0, 6] })]
  assert.equal(ledgerDay(weekendOnly, wednesday, []).bonus, 0)
})

test("an archived item keeps the points of the day it was done", () => {
  const items = [item("1", 3, { type: "daily" }, new Date("2026-09-17T00:00:00Z"))]

  assert.deepEqual(ledgerDay(items, wednesday, [checkIn("1", wednesday)]), {
    localDate: wednesday,
    itemPoints: 3,
    bonus: 0,
  })
})

test("an archived item can no longer block the bonus", () => {
  const items = [
    item("1", 3, { type: "daily" }),
    item("2", 5, { type: "daily" }, new Date("2026-09-17T00:00:00Z")),
  ]

  assert.equal(ledgerDay(items, wednesday, [checkIn("1", wednesday)]).bonus, DAILY_BONUS)
})

test("a check-in whose item is gone is worth nothing rather than NaN", () => {
  assert.equal(ledgerDay([], wednesday, [checkIn("ghost", wednesday)]).itemPoints, 0)
})
