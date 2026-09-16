import { test } from "node:test"
import assert from "node:assert/strict"
import { addDays, daysBetween, dueItems, dueness, isDue, toLocalDate } from "./dates.ts"

const noHistory = { lastDoneDate: null, doneThisWeek: 0 }

test("a late-evening instant belongs to the next local day east of UTC", () => {
  const instant = new Date("2026-09-16T23:30:00Z")
  assert.equal(toLocalDate(instant, "Europe/Berlin"), "2026-09-17")
  assert.equal(toLocalDate(instant, "UTC"), "2026-09-16")
  assert.equal(toLocalDate(instant, "America/New_York"), "2026-09-16")
})

test("the local day boundary moves with daylight saving", () => {
  // Berlin is UTC+2 in July and UTC+1 in December, so the same UTC clock time
  // falls on different local days.
  assert.equal(toLocalDate(new Date("2026-07-01T22:30:00Z"), "Europe/Berlin"), "2026-07-02")
  assert.equal(toLocalDate(new Date("2026-12-01T22:30:00Z"), "Europe/Berlin"), "2026-12-01")
})

test("day maths adds and subtracts whole days", () => {
  assert.equal(addDays("2026-03-28", 1), "2026-03-29")
  assert.equal(addDays("2026-03-01", -1), "2026-02-28")
  assert.equal(daysBetween("2026-03-28", "2026-03-30"), 2)
  assert.equal(daysBetween("2026-03-30", "2026-03-28"), -2)
})

test("a chore is due once its interval has passed, and always when never done", () => {
  assert.equal(dueness("2026-09-02", "2026-09-16", 14), 1)
  assert.equal(dueness("2026-09-09", "2026-09-16", 14), 0.5)
  assert.equal(dueness(null, "2026-09-16", 14), Infinity)
  assert.equal(isDue({ type: "interval", days: 14 }, "2026-09-16", noHistory), true)
})

test("habit schedules pick their days", () => {
  assert.equal(isDue({ type: "daily" }, "2026-09-16", noHistory), true)
  assert.equal(isDue({ type: "weekdays", days: [1, 3, 5] }, "2026-09-16", noHistory), true)
  assert.equal(isDue({ type: "weekdays", days: [1, 3, 5] }, "2026-09-17", noHistory), false)
  assert.equal(isDue({ type: "per_week", count: 3 }, "2026-09-16", { lastDoneDate: null, doneThisWeek: 2 }), true)
  assert.equal(isDue({ type: "per_week", count: 3 }, "2026-09-16", { lastDoneDate: null, doneThisWeek: 3 }), false)
})

test("dueItems derives last done and the week count from check-ins", () => {
  // 2026-09-16 is a Wednesday; its week starts Sunday 2026-09-13.
  const items = [
    { id: "gym", schedule: { type: "per_week", count: 3 } as const },
    { id: "yoga", schedule: { type: "per_week", count: 3 } as const },
    { id: "sheets", schedule: { type: "interval", days: 14 } as const },
    { id: "filter", schedule: { type: "interval", days: 14 } as const },
  ]
  const checkIns = [
    { itemId: "gym", localDate: "2026-09-13" },
    { itemId: "gym", localDate: "2026-09-14" },
    { itemId: "gym", localDate: "2026-09-15" },
    { itemId: "yoga", localDate: "2026-09-12" }, // last week, does not count
    { itemId: "yoga", localDate: "2026-09-14" },
    { itemId: "sheets", localDate: "2026-09-02" },
    { itemId: "filter", localDate: "2026-09-10" },
  ]

  const due = dueItems(items, "2026-09-16", checkIns).map(item => item.id)
  assert.deepEqual(due, ["yoga", "sheets"])
})

test("dueItems ignores check-ins after the date being asked about", () => {
  const items = [{ id: "sheets", schedule: { type: "interval", days: 14 } as const }]
  const checkIns = [{ itemId: "sheets", localDate: "2026-09-20" }]

  assert.deepEqual(dueItems(items, "2026-09-16", checkIns), items)
})

test("doing an item today drops the chore from the list but keeps the habit", () => {
  // The Today view still needs the habit's row to put a checkmark on; the chore
  // has restarted its interval and is not wanted again for two days.
  const items = [
    { id: "pushups", schedule: { type: "daily" } as const },
    { id: "dishes", schedule: { type: "interval", days: 2 } as const },
  ]
  const checkIns = [
    { itemId: "pushups", localDate: "2026-09-16" },
    { itemId: "dishes", localDate: "2026-09-16" },
  ]

  const due = dueItems(items, "2026-09-16", checkIns).map(item => item.id)
  assert.deepEqual(due, ["pushups"])
})

test("bad input throws instead of quietly hiding an item forever", () => {
  assert.throws(() => addDays("2026-9-16", 1), /Not a local date/)
  assert.throws(() => daysBetween("2026-02-31", "2026-03-01"), /Not a local date/)
  assert.throws(() => dueness("2026-09-02", "2026-09-16", 0), /at least one day/)
  assert.throws(() => toLocalDate(new Date(), ""), /Unknown timezone/)
  assert.throws(() => toLocalDate(new Date("nonsense"), "Europe/Berlin"), /Not a valid instant/)
})

test("a malformed check-in date throws instead of reading as a future check-in", () => {
  // "2026-9-01" sorts after "2026-09-16" as a string, so without the guard this
  // row would be skipped and the chore would look never-done and always overdue.
  const items = [{ id: "filter", schedule: { type: "interval", days: 14 } as const }]
  assert.throws(
    () => dueItems(items, "2026-09-16", [{ itemId: "filter", localDate: "2026-9-01" }]),
    /Not a local date: 2026-9-01/,
  )
})
