/**
 * The settings that decide what the app shows, until there is a table to hold
 * them. The settings page (card 0ac962d4) is where these move.
 */

/**
 * The timezone every local date is measured in. docs/research.md section 6:
 * one setting, one answer to "what day is it".
 *
 * ponytail: an environment variable, because one user with one timezone does
 * not need a row and a form yet. The settings page swaps the body of this
 * function; nothing else reads the variable.
 *
 * The fallback is the machine's own zone, which in the container is UTC. A
 * wrong zone rolls the day over at the wrong hour, so set TIMEZONE on any
 * deployment that is not on UTC — `.env.example` says so.
 */
export function timezone(): string {
  return process.env.TIMEZONE ?? Intl.DateTimeFormat().resolvedOptions().timeZone
}

/**
 * What a day is worth on top of its items when everything owed that day is
 * done. docs/data-model.md calls it `daily_bonus`; the settings page (card
 * 0ac962d4) is where it becomes editable.
 *
 * It is read at the moment a day's ledger row is written, so changing it later
 * never rewrites what an earlier day already paid out.
 */
export const DAILY_BONUS = 5
