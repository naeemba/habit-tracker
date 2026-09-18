import { test } from "node:test"
import assert from "node:assert/strict"
import { NOTE_MAXIMUM_LENGTH, parseNote, todayRows, type TodayCheckIn } from "./today.ts"
import type { Schedule } from "./dates.ts"

// A Wednesday, so a weekday habit on [3] is due and one on [1] is not.
const wednesday = "2026-09-16"

function item(id: string, name: string, schedule: Schedule) {
  return { id, name, schedule }
}

function checkIn(itemId: string, localDate: string, note: string | null = null): TodayCheckIn {
  return { itemId, localDate, note }
}

const names = (rows: { item: { name: string } }[]) => rows.map(row => row.item.name)

test("overdue chores come first, then the habits due today", () => {
  const items = [
    item("1", "Brush teeth", { type: "daily" }),
    item("2", "Water plants", { type: "interval", days: 7 }),
    item("3", "Descale kettle", { type: "interval", days: 30 }),
  ]
  const checkIns = [
    checkIn("2", "2026-09-08"), // 8 days on a 7-day interval: dueness 1.14
    checkIn("3", "2026-07-01"), // 77 days on a 30-day interval: dueness 2.57
  ]

  assert.deepEqual(names(todayRows(items, wednesday, checkIns)), ["Descale kettle", "Water plants", "Brush teeth"])
})

test("a chore never done sorts above every chore that has been", () => {
  const items = [
    item("1", "Clean windows", { type: "interval", days: 30 }),
    item("2", "Change sheets", { type: "interval", days: 14 }),
  ]

  assert.deepEqual(names(todayRows(items, wednesday, [checkIn("2", "2026-08-01")])), [
    "Clean windows",
    "Change sheets",
  ])
})

test("two chores never done are ordered by name, not at random", () => {
  const items = [
    item("1", "Wash car", { type: "interval", days: 30 }),
    item("2", "Clean windows", { type: "interval", days: 30 }),
  ]

  assert.deepEqual(names(todayRows(items, wednesday, [])), ["Clean windows", "Wash car"])
})

test("a chore done today keeps its row, at the bottom, so it can be untapped", () => {
  const items = [
    item("1", "Water plants", { type: "interval", days: 7 }),
    item("2", "Brush teeth", { type: "daily" }),
  ]

  const rows = todayRows(items, wednesday, [checkIn("1", wednesday, "left tap running")])

  assert.deepEqual(names(rows), ["Brush teeth", "Water plants"])
  assert.equal(rows[1].done, true)
  assert.equal(rows[1].note, "left tap running")
  assert.equal(rows[0].done, false)
})

test("a habit done today stays listed and marked done", () => {
  const items = [item("1", "Gym", { type: "per_week", count: 3 })]

  const rows = todayRows(items, wednesday, [checkIn("1", "2026-09-14"), checkIn("1", wednesday)])

  assert.equal(rows.length, 1)
  assert.equal(rows[0].done, true)
  assert.equal(rows[0].dueness, null)
})

test("an item that is neither due nor done today is not listed", () => {
  const items = [
    item("1", "Yoga", { type: "weekdays", days: [1] }), // Mondays only
    item("2", "Hoover", { type: "interval", days: 14 }),
  ]

  assert.deepEqual(names(todayRows(items, wednesday, [checkIn("2", "2026-09-15")])), [])
})

test("yesterday's check-in does not mark today done", () => {
  const items = [item("1", "Brush teeth", { type: "daily" })]

  const rows = todayRows(items, wednesday, [checkIn("1", "2026-09-15", "yesterday's note")])

  assert.equal(rows[0].done, false)
  assert.equal(rows[0].note, null)
})

test("a per_week habit is listed every day but only required once the week runs out", () => {
  const items = [item("1", "Gym", { type: "per_week", count: 3 })]

  // Wednesday, nothing done: three left and four days to fit them in.
  const early = todayRows(items, wednesday, [])
  assert.equal(early.length, 1)
  assert.equal(early[0].required, false)

  // Friday, nothing done: three left and three days, so today is owed.
  const late = todayRows(items, "2026-09-18", [])
  assert.equal(late[0].required, true)
})

test("a blank note is no note, and an over-long one is refused", () => {
  assert.equal(parseNote("  "), null)
  assert.equal(parseNote(null), null)
  assert.equal(parseNote("  ran 5k  "), "ran 5k")
  assert.throws(() => parseNote("x".repeat(NOTE_MAXIMUM_LENGTH + 1)), RangeError)
})
