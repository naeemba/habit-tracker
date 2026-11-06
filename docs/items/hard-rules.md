# Items: hard rules

Where a rule is in `CLAUDE.md` it is one line there; this is what breaking it
looked like. The others come from the code and its history.

## items-rule-1: The list never throws on a bad row

`{"type":"weekdays"}` with no `days` threw out of `describeSchedule` and made
`/items` a 500. Every item became unreachable, the broken one included, because
an item is only linked from that list. A row with no count printed "undefined
times a week", and an unknown type rendered a blank line in silence (#3). Not
in `CLAUDE.md`.

## items-rule-2: The schedule numbers carry no `min` or `max`

The browser validates every mounted control, and every schedule's fields stay
mounted. A 0 left in "Times a week" blocked an "Every day" save with a
validation bubble on a field the save ignores, which on a phone reads as the
button doing nothing (#3). `parseItemForm` enforces both ranges and says so in a
sentence. Not in `CLAUDE.md`.

