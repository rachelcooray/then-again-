# Then Again

Timeless puzzles. Familiar moments. A little piece of the past, every day.

A mobile-first daily puzzle club built with React, TypeScript and Vite, wrapped later with Capacitor for iOS and Android.
The visual design follows the *Modern Puzzle Club* canvas; the build follows the phases in the build brief.

## Running it

```sh
npm install
npm run dev          # local dev server
npm run build        # typecheck and production build into dist/
npm test             # unit tests (Vitest)
npm run test:e2e     # browser acceptance tests (Playwright)
```

Set `VITE_SHOW_CATALOGUE=false` to hide the internal full-catalogue view in a public build.

## Layout

| Path | What it holds |
| --- | --- |
| `src/styles/tokens.css` | Colour, type and size tokens, dark theme, the three text sizes |
| `src/styles/app.css` | Shared components: ticket and family cards, navigation, chips, switches |
| `src/content/` | The 22 formats, theme rotation, daily sets by local date, the planning catalogue |
| `src/state/` | On-device progress and settings, streak and badge maths, local-midnight rollover |
| `src/screens/` | Today, Library, Catalogue, Themes, Collection, Rewards, Gems, Reminders, Settings, Play |
| `e2e/` | Phase acceptance tests |

## Build phases

1. **Foundation**: done. Design tokens, app shell, mobile and desktop navigation, all main screens, local progress.
2. First puzzle wave: Word Guess, Word Search, Sudoku, Rewind, Circle Word Finder, Daily Bingo, 4×4 Logic.
3. Content pipeline: Supabase, generators and solvers, safety gate, 90-day calendar, admin dashboard.
4. Remaining 15 formats.
5. Gems, rewards and streaks (server-side wallet).
6. Native apps and reminders.
7. Monetisation, switched off for the pilot.
8. Store preparation and pilot.
