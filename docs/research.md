# Research Notes

What was learned from other apps and platform docs, and what it means for
this project. Each section ends with the decision it drove.

## 1. Habit strength score (from Loop Habit Tracker)

Loop uses exponential smoothing. Every check-in counts, recent ones more.

```
multiplier = 0.5 ^ (frequency / 13)      # frequency = 1 for daily
score      = previousScore * multiplier + checkmark * (1 - multiplier)
```

`checkmark` is 1 when done, 0 when missed. `frequency` is the expected
repetitions per day (a 3x/week habit has frequency 3/7). With frequency 1
the old score keeps ~95% weight. A perfect daily habit reaches 80% after one
month, 96% after two, 99% after three. Missing a day dents the score, it
does not zero it.

Decision: use this formula unchanged for habits. Chores do not get a score;
they get a dueness level (section 3).

Sources: [uhabits FAQ](https://github.com/iSoron/uhabits/discussions/689),
[constants discussion](https://github.com/iSoron/uhabits/discussions/1112),
[where strength is computed](https://github.com/iSoron/uhabits/discussions/580).

## 2. Habit features worth copying

- Today view with large tap targets, nothing else on the first screen.
- Schedules: daily, specific weekdays, N times per week.
- Streak (current and best) and a per-habit heatmap.
- No categories, no social, no gamification beyond points.

Sources: [Zapier](https://zapier.com/blog/best-habit-tracker-app/),
[Reclaim](https://reclaim.ai/blog/habit-tracker-apps),
[Clockify](https://clockify.me/blog/productivity/best-habit-tracker-apps/).

## 3. Chores (from Tody and Sweepy)

Tody: a chore "ages" toward due since its last completion. It shows a
green-to-red dueness gradient, not a calendar. Sweepy: chores carry effort
points, and a daily list can be sized to available energy.

```
dueness = daysSinceLastDone / intervalDays     # 0 fresh, 1 due, >1 overdue
```

Decision: chores are interval-based with a dueness value. Overdue chores
sort to the top of Today. Points per chore double as effort weight.

Sources: [Tody vs Sweepy](https://plastnofy.com/articles/tody-vs-sweepy),
[Tody](https://todyapp.com/),
[Tidywell comparison](https://tidywell-app.com/blog/tody-vs-sweepy-vs-tidywell).

## 4. Web Push on iOS

- Works only when the app is installed from Safari via Add to Home Screen.
  Needs iOS 16.4 or later. In the EU, iOS 17.4 removed Home Screen web apps,
  so push does not work there.
- `Notification.requestPermission()` must run inside a tap handler.
- Standard VAPID keys, same as Chrome.
- Every push must show a visible notification. Silent pushes get the
  subscription revoked.
- Badging API works on iOS 16.4+ (show count of items due).
- Declarative Web Push (Safari 18.4+): the server sends plain JSON, no
  service worker code runs. Format:

```json
{ "web_push": 8030,
  "notification": { "title": "Water the plants", "body": "Due today",
                    "navigate": "https://app.example/today" } }
```

Decision: target is Android Chrome only. Standard Web Push with a service
worker `push` handler and VAPID keys. Skip Declarative Web Push. The iOS
notes above stay for reference in case that changes.

Sources: [MagicBell iOS limitations](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide),
[instantpwa](https://instantpwa.com/answers/can-pwa-send-push-notifications-ios),
[WebKit: Meet Declarative Web Push](https://webkit.org/blog/16535/meet-declarative-web-push/),
[webpush-ios-example](https://github.com/andreinwald/webpush-ios-example).

## 5. Offline writes

Use an outbox: queued writes in IndexedDB, replayed in order when `online`
fires or the app opens. Each write carries a client UUID; the server ignores
a duplicate. Android Chrome supports the Background Sync API, so the service
worker can also trigger the replay, but a page-side replay is enough and
avoids two replayers racing.

Decision: outbox in IndexedDB, page-side replay, idempotent server endpoints
keyed on the client id. Background Sync only if page replay proves flaky.

Sources: [Outbox pattern](https://amux.io/guides/pwa-offline-sync-outbox-pattern/),
[Offline-first patterns](https://rohitraj.tech/notes/pwa-offline-sync).

## 6. Dates and time zones

Store both the UTC instant and the local calendar date (`YYYY-MM-DD`) on
every check-in. Enforce one check-in per item per local day with a unique
constraint. Keep all day-boundary maths in one module. Recompute streaks
and scores on read; the data is small.

Decision: `local_date` column plus `UNIQUE(item_id, local_date)`. One
`dates` module owns "what day is it". Timezone is a single setting.

Source: [Habit tracker schema notes](https://terminalskills.io/use-cases/build-habit-tracking-app),
[drawdb example](https://www.drawdb.app/examples/habit-tracker).

## 7. Coolify deployment

One Dockerfile, one container. SQLite file on a named volume mounted at
`/app/data`. Run as a non-root user. Set the port and domain in Coolify.

Sources: [Coolify persistent storage](https://coolify.io/docs/knowledge-base/persistent-storage),
[SQLite on Coolify](https://samperalabs.com/posts/how-to-manage-sqlite-databases-on-a-vps-with-coolify),
[Node on Coolify with Dockerfile](https://sreyaj.dev/deploy-nodejs-applications-on-a-vps-using-coolify-with-dockerfile).
