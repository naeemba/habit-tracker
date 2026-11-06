# Today

The home page, `/`: everything due today in one list, one tap to check an item
off, one more tap to take it back. A check-off is a row in the `checkins` table,
and an optional short note rides on it.

## The list

`todayRows` in `src/lib/today.ts` decides what is listed and in what order.

- Listed: everything due today ([schedules](../schedules/README.md)), plus
  anything already checked off today, whatever its schedule says. A chore
  leaves the due list the moment it is done, so without the second half a chore
  tapped by mistake would vanish with no row left to untap
  ([today-rule-1](hard-rules.md#today-rule-1-a-tap-never-removes-its-own-row)).
- Order: overdue chores at the top, riper first, then the habits due today,
  then everything already done. Two chores never done are both infinitely
  overdue; ties and habits go by name, so the list does not reshuffle under a
  thumb between taps.
- Each row says whether it is `required` today, which is not the same as listed
  ([schedules-rule-3](../schedules/hard-rules.md#schedules-rule-3-owed-is-not-listed)).
  The header counts the required rows not yet done and shows the day's points
  from the ledger: `2 left · 7p`, or `all done · 13p` once the bonus lands
  ([points](../points/README.md)).
- An empty day reads "Nothing due today." A link to Items sits at the bottom.

## One tap

The whole row is the button, the width of the phone. The circle carries the
item's colour as a ring and shows its icon, or a ✓ once done; it has no fill,
because a ✓ in the page's text colour on a mid-tone item colour is about 3:1.

`toggleToday` (in `src/app/actions.ts`) checks the session, takes the day from
the server clock and the timezone setting, never from the form, toggles the
check-in, then writes the day's ledger row. `toggleCheckIn` deletes first and
inserts only when nothing was deleted; the unique pair `(item_id, local_date)`
means two taps landing at once cannot earn the points twice, and is what will
make an offline queue safe to replay. Deleting an item takes its check-ins
with it.

## The note

Only once an item is done, folded away in a `<details>` under the row so it
never sits between a thumb and the tap. Up to 200 characters, trimmed; saving a
blank one clears it.

## Files

- What is listed and in what order, and the note's limit: `src/lib/today.ts`,
  `src/lib/today.test.ts`
- The `checkins` table and its queries: `src/lib/schema/checkins.ts`,
  `src/lib/checkin-queries.ts`
- The page and its two actions: `src/app/page.tsx`, `src/app/actions.ts`

## Scenarios

- Given a daily habit, a 7-day chore 8 days old and a 30-day chore 77 days old,
  when Today renders, then the 30-day chore is first, the 7-day chore second,
  the habit last.
- Given one chore never done and one done a while ago, when Today renders, then
  the never-done chore is above.
- Given two chores never done, when Today renders, then they are in name order.
- Given a chore checked off today with a note, when Today renders, then it is
  still listed, at the bottom, marked done, with its note.
- Given a habit checked off today, when Today renders, then it is listed and
  marked done.
- Given an item neither due nor done today, when Today renders, then it is not
  listed.
- Given an item done yesterday, when Today renders, then it is not marked done.
- Given gym 3 per week with nothing done, when Today renders on Monday, then it
  is listed and not required; by Friday it is required.
- Given a blank note, when saved, then there is no note; a note over 200
  characters is refused.
- Given an item tapped, tapped again and tapped again, when the table is read,
  then there is exactly one check-in for the day (#4).

## Open questions

- `CLAUDE.md` says a check-off must succeed without network and sync later. A
  tap is a server action today, so with no network it fails; the outbox is not
  built.
- The check-in id is generated on the server; [data-model.md](../data-model.md)
  asks for a client-generated id so an offline replay dedupes on it.
- The tap posts "flip it", not the state it saw. Two overlapping taps on a
  checked row can leave it checked with its note gone, and queued taps replayed
  out of order can land on the wrong state
  ([today-decision-4](decisions.md#today-decision-4-the-toggle-race-is-accepted-for-now)).
- The green-to-red dueness hint per chore is not drawn; the ordering it feeds
  is here.
- Nothing writes a past day: a day missed cannot be ticked afterwards.
