# Items: history

One line per merged change: date, pull request, why.

- 2026-09-16 #3 — The `items` table and its screens: list, new, edit, delete, validated server-side, a list that survives a bad row (items-decision-1 to 8, items-rule-1, items-rule-2)
- 2026-09-18 #4 — One guard for item ids shared by the query modules; `src/lib` imports carry the `.ts` extension and the schema moves to `src/lib/schema/items.ts` (conventions-rule-2)
- 2026-09-18 #5 — Every item write rewrites today's ledger row; `listAllItems` for the ledger (points-rule-2, points-rule-3)
