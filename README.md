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
npm run content      # regenerate the 90-day puzzle calendar (takes about seven minutes)
```

The internal full-catalogue view is hidden unless the build sets `VITE_SHOW_CATALOGUE=true`.

## The daily calendar

`npm run content -- [first-date] [days]` (default `2026-10-19 90`) runs `scripts/content/plan.ts`:

- Every generated format gets a new puzzle every day. Difficulty follows the week: Monday and Tuesday easy,
  Wednesday and Thursday medium, Friday and Saturday hard, Sunday medium.
- Each puzzle passes the safety and quality gate (`scripts/content/gate.ts`): blocked words, accidental words in
  letter grids, contact details, and an independent solver check for one answer.
- Answers don't come back within each format's window, and the day's four mix a word puzzle, the theme's word search,
  a logic puzzle and one more, without repeating yesterday's formats.
- The theme's words and clues (`scripts/content/theme-words.ts`) feed Word Search, Word Guess, Anagrams and Bingo.
- Output: one scrambled file per day in `src/content/generated/days/`, loaded only around today, plus
  `content/reports/runway.md` (what's covered, what needs review, when the calendar runs out) and `checks.json`.

Formats that need written content (Rewind, Mini Crossword, The Quiz, Higher or Lower, Mystery Object, Put It in Order)
still play the design puzzle every day and are kept out of the day's four. To play the design puzzles everywhere, set
`localStorage['then-again:content'] = 'canvas'` (the per-format browser tests do this).

## Layout

| Path | What it holds |
| --- | --- |
| `src/styles/tokens.css` | Colour, type and size tokens, dark theme, the three text sizes |
| `src/styles/app.css` | Shared components: ticket and family cards, navigation, chips, switches |
| `src/content/` | The 22 formats, theme rotation, daily sets by local date, the planning catalogue |
| `src/state/` | On-device progress and settings, streak and badge maths, local-midnight rollover |
| `src/screens/` | Today, Library, Catalogue, Themes, Collection, Rewards, Gems, Reminders, Settings, Play |
| `src/engines/` | Puzzle engines: game rules (unit-tested), solvers, and each engine's screen |
| `design/canvas/` | The design canvas source files, for reference |
| `e2e/` | Phase acceptance tests |

## Build phases

1. **Foundation**: done. Design tokens, app shell, mobile and desktop navigation, all main screens, local progress.
2. **First puzzle wave**: done. Word Guess, Word Search, Sudoku, Rewind, Circle Word Finder, Daily Bingo and 4×4 Logic,
   on seven engines in `src/engines/` that share one interface. Word games check guesses against a SCOWL dictionary
   (`npm run dictionary` rebuilds it). The design canvas puzzles are kept in `src/content/canvas.ts`.
3. **Content pipeline**: mostly done. Generators and solvers for 16 formats, the safety gate and the 90-day calendar
   with a weekly difficulty curve (see above). Supabase schema is ready; still to come: the admin dashboard and
   written content for the six text-based formats.
4. Remaining 15 formats.
5. Gems, rewards and streaks (server-side wallet).
6. Native apps and reminders.
7. Monetisation, switched off for the pilot.
8. Store preparation and pilot.
