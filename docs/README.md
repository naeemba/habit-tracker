# Docs

One folder per feature. Each feature's `README.md` lists the files it owns,
what it does, its acceptance scenarios and open questions; `hard-rules.md`,
`decisions.md` and `history.md` appear with their first entry. A file is
claimed by one feature only, in that feature's README.

Every rule and decision has a stable id, `<feature>-rule-N` and
`<feature>-decision-N`, never renumbered. History lines, pull requests and
commits cite the id.

## Features

| Feature | What it is |
|---|---|
| [items](items/README.md) | Habits and chores: the list, the add and edit form, delete |
| [schedules](schedules/README.md) | The dates module: local dates, the four schedules, what is due and what is owed |
| [today](today/README.md) | The home page: what is due today, one tap to check off, a note |
| [points](points/README.md) | The per-day ledger and the daily bonus |
| [settings](settings/README.md) | The timezone and the bonus value, until there is a settings page |
| [sign-in](sign-in/README.md) | Passkey and magic link through next-starter, and which routes are gated |
| [layout](layout/README.md) | The page shell: font, colours, dark mode |
| [deployment](deployment/README.md) | The image, the two migration tracks, local development, held versions |

## Cross-cutting

| Folder | What it is |
|---|---|
| [conventions](conventions/README.md) | Code style, import spelling, module split, checks |

## Inputs

Research and the data model, written before the code. Each spans several
features, so they stay here, and the feature docs link to them.

- [research.md](research.md) — what other apps do, the formulas, platform
  limits, and the decisions each drove.
- [data-model.md](data-model.md) — the planned tables, schedule shapes and
  derived values, including tables not built yet.
