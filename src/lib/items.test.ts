import { deepStrictEqual, strictEqual, throws } from "node:assert/strict"
import { test } from "node:test"
import { describeSchedule, isItemId, parseItemForm, readSubmittedFields } from "./items.ts"

/** A form that would save, so each test can spoil exactly one field. */
function validForm(overrides: Record<string, string | string[]> = {}): FormData {
  const fields: Record<string, string | string[]> = {
    name: "Gym",
    icon: "🏋️",
    color: "#a1b2c3",
    points: "3",
    scheduleType: "daily",
    reminderTime: "",
    ...overrides,
  }
  const form = new FormData()
  for (const [field, value] of Object.entries(fields)) {
    for (const one of Array.isArray(value) ? value : [value]) form.append(field, one)
  }
  return form
}

test("a daily habit reads back whole", () => {
  deepStrictEqual(parseItemForm(validForm()), {
    kind: "habit",
    name: "Gym",
    icon: "🏋️",
    color: "#a1b2c3",
    points: 3,
    schedule: { type: "daily" },
    reminderTime: null,
  })
})

test("the interval schedule is what makes an item a chore", () => {
  const chore = parseItemForm(validForm({ scheduleType: "interval", intervalDays: "14" }))
  strictEqual(chore.kind, "chore")
  deepStrictEqual(chore.schedule, { type: "interval", days: 14 })
  strictEqual(parseItemForm(validForm({ scheduleType: "per_week", timesPerWeek: "3" })).kind, "habit")
})

test("weekdays are de-duplicated and sorted", () => {
  const habit = parseItemForm(validForm({ scheduleType: "weekdays", weekdays: ["5", "1", "1"] }))
  deepStrictEqual(habit.schedule, { type: "weekdays", days: [1, 5] })
})

test("a weekday list that matches no day is refused", () => {
  throws(() => parseItemForm(validForm({ scheduleType: "weekdays" })), /at least one weekday/)
  throws(() => parseItemForm(validForm({ scheduleType: "weekdays", weekdays: ["7"] })), /at least one weekday/)
})

test("counts that would hide an item forever are refused", () => {
  throws(() => parseItemForm(validForm({ scheduleType: "per_week", timesPerWeek: "0" })), /Times a week/)
  throws(() => parseItemForm(validForm({ scheduleType: "interval", intervalDays: "0" })), /number of days/)
  throws(() => parseItemForm(validForm({ scheduleType: "interval" })), /number of days/)
})

test("a schedule that is missing or unknown is refused", () => {
  throws(() => parseItemForm(validForm({ scheduleType: "" })), /Pick a schedule/)
  throws(() => parseItemForm(validForm({ scheduleType: "monthly" })), /Pick a schedule/)
})

test("a blank name is not a name", () => {
  throws(() => parseItemForm(validForm({ name: "   " })), /name is required/)
  strictEqual(parseItemForm(validForm({ name: "  Gym  " })).name, "Gym")
})

test("colour and reminder time have to be the shapes the columns promise", () => {
  throws(() => parseItemForm(validForm({ color: "red" })), /#a1b2c3/)
  throws(() => parseItemForm(validForm({ reminderTime: "25:00" })), /07:30/)
  strictEqual(parseItemForm(validForm({ reminderTime: "07:30" })).reminderTime, "07:30")
})

test("points may be zero but not a fraction or a negative", () => {
  strictEqual(parseItemForm(validForm({ points: "0" })).points, 0)
  throws(() => parseItemForm(validForm({ points: "1.5" })), /Points/)
  throws(() => parseItemForm(validForm({ points: "-1" })), /Points/)
})

test("a name or icon longer than its column is refused", () => {
  throws(() => parseItemForm(validForm({ name: "a".repeat(81) })), /at most 80 characters/)
  strictEqual(parseItemForm(validForm({ name: "a".repeat(80) })).name, "a".repeat(80))
  throws(() => parseItemForm(validForm({ icon: "a".repeat(17) })), /at most 16 characters/)
})

test("a refused save hands back everything that was typed", () => {
  const form = validForm({ name: "   ", scheduleType: "weekdays", weekdays: ["1", "5"] })
  const typed = readSubmittedFields(form)
  throws(() => parseItemForm(form), /name is required/)
  // The form redraws itself from this object, so anything missing here is a
  // field the user has to type again on a phone.
  strictEqual(typed.name, "   ")
  strictEqual(typed.icon, "🏋️")
  strictEqual(typed.color, "#a1b2c3")
  strictEqual(typed.points, "3")
  strictEqual(typed.scheduleType, "weekdays")
  deepStrictEqual(typed.weekdays, ["1", "5"])
})

test("only a uuid counts as an item id", () => {
  strictEqual(isItemId("0a4a0fb1-f7c7-4cf3-b5a2-5a420dabcccd"), true)
  strictEqual(isItemId("new"), false)
  strictEqual(isItemId(undefined), false)
})

test("every schedule describes itself", () => {
  strictEqual(describeSchedule({ type: "daily" }), "Every day")
  strictEqual(describeSchedule({ type: "weekdays", days: [1, 5] }), "Monday, Friday")
  strictEqual(describeSchedule({ type: "per_week", count: 1 }), "Once a week")
  strictEqual(describeSchedule({ type: "per_week", count: 3 }), "3 times a week")
  strictEqual(describeSchedule({ type: "interval", days: 14 }), "Every 14 days since last done")
})

test("a schedule the database should never have holds says so instead of throwing", () => {
  // jsonb has no CHECK constraint, so these can exist. Throwing would 500 the
  // list page, and the list is the only way to reach the row and fix it.
  const unreadable = [
    { type: "weekdays" },
    { type: "weekdays", days: "1,3" },
    { type: "weekdays", days: [] },
    { type: "weekdays", days: ["1", "5"] },
    { type: "per_week" },
    { type: "per_week", count: 0 },
    { type: "interval" },
    { type: "interval", days: 0 },
    { type: "monthly" },
  ]
  for (const schedule of unreadable) {
    strictEqual(describeSchedule(schedule as never), "Schedule needs fixing")
  }
})
