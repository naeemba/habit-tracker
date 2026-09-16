# Habit Tracker

A personal habit and chore tracker with a points-based reward system.
Web app built for the phone (installable PWA), backed by a small server,
deployed on Coolify.

## Why

Mostly chores, some habits. Every completed item earns points. Points add
up toward a real reward (first goal: a Thunderbolt 5 dock). Missing a day
costs only that day's bonus, never the points already earned.

## Features

### Items

- **Habits** — fixed schedule: daily, specific weekdays, N times per week.
- **Chores** — interval from last completion: "every 14 days", resets when done.
- Name, icon, color, points value (default 1).
- Optional short note on each check-in.

### Today

- One list of everything due today, one tap to check off.
- Overdue chores show at the top.
- Works offline; syncs when back online.

### Progress

- Streaks (current and best) for habits.
- Habit strength score: one miss dents it, does not zero it.
- Per-item heatmap calendar.

### Points and rewards

- Each completed item earns its points.
- Daily bonus: +5 when everything due today is done.
- One active reward goal: name, target points, optional picture.
- Progress bar and "at your current pace: ~N days left".
- Ledger of points earned per day.
- Redeem when the goal is reached; points reset or carry over.

### Platform

- PWA: home screen install, full screen, offline.
- Push reminders at a set time per item.
- Sync across devices through the server.
- Single user, sign-in locked to one email (passkey, magic link, or Google).
- Export everything to JSON.
- Dark mode follows the system.

## Not in scope

Social features, gamification beyond points, categories, penalties for
missed days, multiple reward goals at once. Add when one is missed.

## Development

Needs Node 22.18+ (for running TypeScript without a flag) and Docker.

```bash
cp .env.example .env          # then fill in BETTER_AUTH_SECRET
docker compose up -d db       # Postgres on localhost:5435
npm install
npm run db:migrate            # creates the auth tables
npm run dev                   # http://localhost:3000
```

Port 5435 rather than 5432 — `docker-compose.yml` says why.

To run the app the way it is deployed, as a container against the same
database:

```bash
docker compose up -d --build  # http://localhost:3000
```

## Documents

- [Research notes](docs/research.md) — what other apps do and the decisions taken.
- [Stack decision](docs/stack.md) — Next.js on next-starter, Postgres, what to add.
- [Data model](docs/data-model.md) — tables, schedule shapes, derived values.
- Work board: `.dashboard/board.json`.

## Deployment

App container plus Postgres service on Coolify. See [docs/stack.md](docs/stack.md).
