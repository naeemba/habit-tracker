# Layout

The page every screen sits in: the root layout, the font, the colour tokens, and
dark mode. Each page sets its own narrow column (`max-w-md`) for the phone.

## How it looks

- `src/app/layout.tsx` sets the title "Habit Tracker" and loads one font,
  Geist, from Google Fonts, wired into Tailwind's `font-sans`. The fonts that
  are downloaded are the fonts that are used: the phone pays for one webfont
  over mobile data.
- `src/app/globals.css` imports Tailwind and defines the background and
  foreground colours, swapped under `prefers-color-scheme: dark`, so dark mode
  follows the system.

## Files

- The shell: `src/app/layout.tsx`, `src/app/globals.css`, `src/app/favicon.ico`

## Scenarios

- Given the phone is in dark mode, when any page opens, then it renders on the
  dark background.

## Open questions

- The PWA (home screen install, full screen, offline) is not built; there is no
  manifest or service worker.
