# OnPurpose contributor and agent guidance

## Start here

Read `PROJECT_GOALS.md`, `docs/DEVELOPMENT.md`, and `docs/DECISIONS.md`.
OnPurpose is a provisional name. The founder is new to the stack: explain
technical choices in plain language and connect them to the product goal.

## Product direction

The core goal is minimising cognitive friction so tracking becomes a seamless
part of life. The home view is a habit-by-day grid with checkbox and numeric
cells, distinct name taps for statistics, and user-chosen stable row order.
Protect stable row positions, direct access to the list, and immediate feedback.
Do not add navigation, dashboards, celebrations, login, or a backend without a
requirement. Distinguish founder decisions from assistant proposals in the docs.
Incremental change storage and export are confirmed requirements; read
`docs/STORAGE.md` before implementing persistence. Current screen data is explicitly a disposable demo, not real saved habit data.

## Stack and layout

- React Native + Expo SDK 57, TypeScript strict mode, npm with package-lock.json.
- `App.tsx` owns screen state and dialogs; `src/HabitGrid.tsx` renders the grid.
- `src/gridLayout.ts` calculates adaptive column geometry for both orientations.
- `src/useGridScroll.ts` synchronizes native scrolling on the UI thread; never
  put per-frame list synchronization back on the JavaScript thread.
- `src/gridNavigation.ts` owns the future-pull threshold and signed date offsets.
- `src/ColourPicker.tsx` and `src/colors.ts` own preset/custom colours and OKLCH.
- `src/calendar.ts` and `src/useLocalToday.ts` handle local dates and rollover.
- `src/habits.ts` contains demo habits/colours. `index.ts` registers the app.
- `app.json` owns Expo configuration. Generated native folders stay ignored.
- Linux is the development host; a physical iPhone is the primary test device.
- Use `npx expo install <package>` for Expo/native dependencies to match the SDK.
- Keep dependencies and architecture small. Add structure when a feature needs it.
- Use functional state updates when new state depends on previous state.
- When persistence is added, define schema/versioning, local-day semantics,
  error handling, and recovery before relying on it for user data.

## UI and accessibility

Keep completed rows in place. Avoid gesture-only essential actions. Expose
checkbox state and meaningful labels to accessibility services. Permit font
scaling, respect safe areas, and allow scrolling when content needs it.
Do not trade reliability or readable controls for the three-second aspiration.

## Verification

Run `npm run check` and relevant `npm test` suites after code changes, and `npm run export:ios` when changing
native-facing imports or Expo config. Web preview helps layout checks but is not
evidence that iOS runs correctly. Report actual checks and any unverified device
behaviour. Follow `docs/TESTING.md` for phone and release testing.
Add focused tests when persistence, date logic, event replay/export, or other consequential behaviour
arrives; avoid tests that merely duplicate trivial markup.

For phone screenshots, read `.dev/previews/latest.png` after the founder shares
a preview by long-pressing the app heading or a dialog title; dated images are
alongside it. Preview settings are in ignored
`.env.local`. Use `npm run preview:server` for the local receiver. Do not commit
captures or pairing tokens. Run `npm run test:preview` after changing the receiver;
preserve both the env flag and `__DEV__` guard around preview capture.

## Documentation and release

Update relevant docs when changing commands, architecture, or confirmed scope.
Keep credentials, signing files, tokens, local logs, and real user habit data out
of Git. `EXPO_PUBLIC_*` variables are public in the app, not secret storage.
Keep deployment and signing manual until release automation is deliberately set
up. Do not claim App Store readiness from a successful JavaScript bundle export.
Preserve the Expo template notice in `docs/licenses/EXPO_TEMPLATE_LICENSE.txt`.
Project licence, pricing, final bundle identifier, and final brand remain open.
