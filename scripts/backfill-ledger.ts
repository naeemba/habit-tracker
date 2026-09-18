// Writes a ledger row for every day that already has check-ins and no row yet.
//
// The ledger table arrived after the check-ins did, and only a change to a
// day's check-ins writes its row — which in practice only ever lands on today.
// Without this pass, every day recorded before the table existed is worth zero
// forever, and the reward total reads low without looking wrong.
//
// Days that already have a row are skipped, so running this again after an
// item's points change leaves what those days paid out alone. Run it once
// after `db:migrate`; running it twice is a no-op.
import { eq, isNull } from "drizzle-orm"
import { db } from "@naeemba/next-starter/db"
import { writeLedgerDay } from "../src/lib/ledger-queries.ts"
import { checkIns } from "../src/lib/schema/checkins.ts"
import { ledger } from "../src/lib/schema/ledger.ts"

const days = await db
  .selectDistinct({ localDate: checkIns.localDate })
  .from(checkIns)
  .leftJoin(ledger, eq(ledger.localDate, checkIns.localDate))
  .where(isNull(ledger.localDate))
// ponytail: `writeLedgerDay` re-reads both tables per day, so this is a scan
// per day. It runs once over the days that predate the table — a handful. Read
// once and loop in memory if it is ever pointed at years.
for (const { localDate } of days) await writeLedgerDay(localDate)

console.log(`Wrote ${days.length} ledger rows.`)
// The starter's `db` is a shared pool with no close, so the process would hang.
process.exit(0)
