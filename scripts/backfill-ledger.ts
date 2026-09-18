// Writes a ledger row for every day that already has check-ins.
//
// The ledger table arrived after the check-ins did, and only a change to a
// day's check-ins writes its row — which in practice only ever lands on today.
// Without this pass, every day recorded before the table existed is worth zero
// forever, and the reward total reads low without looking wrong.
//
// Idempotent: each day is recomputed from the same rows the app reads, so
// running it twice writes the same numbers. Run it once after `db:migrate`.
import { db } from "@naeemba/next-starter/db"
import { writeLedgerDay } from "../src/lib/ledger-queries.ts"
import { checkIns } from "../src/lib/schema/checkins.ts"

const days = await db.selectDistinct({ localDate: checkIns.localDate }).from(checkIns)
// ponytail: `writeLedgerDay` re-reads both tables per day, so this is a scan
// per day. It runs once over the days that predate the table — a handful — and
// a failure names the day it stopped on. Read once and loop in memory if it is
// ever pointed at years.
for (const { localDate } of days) await writeLedgerDay(localDate)

console.log(`Wrote ${days.length} ledger rows.`)
// The starter's `db` is a shared pool with no close, so the process would hang.
process.exit(0)
