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
`docs/STORAGE.md` before implementing persistence. Entries, colours, start dates, haptics and row spacing now persist. Sample habits are initialized
once; never reset or reseed an existing store during loading or an error.
The requested preset icon update uses normal undoable edits in
`src/storage/presetIcons.ts`; preserve earlier icon choices/removals and raw history.

## Stack and layout

- React Native + Expo SDK 57, TypeScript strict mode, npm with package-lock.json.
- `src/storage/` owns versioned events, replay, native SQLite, the write queue,
  undo/redo, and backup restore. Read STORAGE.md before changing these invariants.
- `App.tsx` owns screen state and dialogs; `src/HabitGrid.tsx` renders the grid.
- `src/GridCells.tsx` selects individual entries/date-heading state from the store.
  Keep grid callbacks/definitions stable across save acknowledgements. Cache colour
  levels in `gridAppearance.ts` and retain date identities when extending history.
  See `docs/PERFORMANCE.md`; never infer iPhone frame rates from Node benchmarks.
- `GridLoadingBackdrop.tsx` paints non-interactive fallback dates/dashes beneath
  virtualized columns. Keep it on the UI-thread offset, outside the virtualized
  render window, and hidden from accessibility. Real columns must cover it fully.
- Keep the compact top bar visible, with Today centred and History/Settings at right.
  Month/year stays beside the day headings; future pull streak grows left from the
  fixed right edge of the existing divider beneath the headings. Do not add a border.
- `src/AppPanel.tsx` owns real change History/undo and the Settings/backup sheet; `src/Icon.tsx` owns outline icons.
- `src/HistoryView.tsx` renders compact action rows and sticky edit-day groups;
  `src/history.ts` keeps grouping separate from effective habit dates. Preserve
  reverse sequence order; do not reorder logged actions by their timestamps.
- `src/HabitName.tsx` and `src/useHabitReorder.ts` own hold/menu/drag interactions.
  Only completed drops persist. Keep cells distinct, support cancellation, and
  preserve archive entries. `src/HabitDialog.tsx` owns editor/colour drafts;
  `src/ArchivedHabits.tsx` owns the Settings archive/restore list. Add belongs at the
  end of the grid. `src/HabitStatsScreen.tsx` owns full-screen statistics, with pure
  calculations in `src/statistics.ts`. Read HABIT_MANAGEMENT.md and STATISTICS.md.
  `src/dev/sampleData.ts` owns isolated mock history for statistics testing. Keep
  it in memory, excluded via `__DEV__` from release, and separate from real data.
  `src/HabitSymbol.tsx` renders optional emoji/Phosphor/Tabler icons; the editor owns
  selection drafts through `src/HabitIconPicker.tsx`. Read HABIT_ICONS.md.
  `src/ReorderRow.tsx` moves the actual name/cell views together during drag/drop;
  do not introduce a visually different floating placeholder. Keep native sibling
  order stable during preview swaps. Send swap targets through shared values, not
  React state that rerenders the grid during touch input. Use one absolute animated Y coordinate
  via translateY from a fixed top: 0 anchor. Do not animate layout top each frame
  or combine changing layout anchors with a compensating transform. Measure height on the inner
  name control so position animation does not report per-frame layout to JS.
  `src/motion.ts` shares reduced-motion-aware row/menu transitions; keep name and
  date-cell layout timing aligned.
- `src/displayPreferences.ts` owns column spacing, week start and date fading defaults; keep absent-field defaults compatible with old logs and all preferences outside History/Undo. Read docs/SETTINGS.md.
- `src/rowSpacing.ts` owns saved Compact/Standard/Roomy geometry; preserve font scaling and measured row heights.
- `src/StartDateField.tsx` owns the native draft date picker; existing dates remain inferred until edited. Explicit start dates bound statistics without deleting entries. New edits/exports use v6, retaining v1–v5 replay.
- `src/useStatsDismissal.ts` owns UI-thread pull dismissal; only a drag starting at the top qualifies. Keep an accessible Back button.
- `src/gridLayout.ts` calculates adaptive column geometry for both orientations.
- `src/useGridScroll.ts` synchronizes native scrolling on the UI thread; never
  put per-frame list synchronization back on the JavaScript thread.
- `src/gridNavigation.ts` owns the future-pull threshold and signed date offsets.
- `src/ColourPicker.tsx` and `src/colors.ts` own preset/custom colours and OKLCH.
- `src/haptics.ts` owns action feedback; never trigger it from state updaters
  or await it before updating UI. Keep routine scrolling quiet.
- `src/calendar.ts` and `src/useLocalToday.ts` handle local dates and rollover.
- `src/habits.ts` contains demo habits/colours. `index.ts` registers the app.
- `app.json` owns Expo configuration. Generated native folders stay ignored.
- Linux is the development host; a physical iPhone is the primary test device.
- Use `npx expo install <package>` for Expo/native dependencies to match the SDK.
- Keep dependencies and architecture small. Add structure when a feature needs it.
- Use functional state updates when new state depends on previous state.
- Preserve append-only normal edits, atomic log/projection transactions, serialized
  rapid writes, and visible save failure/retry. Undo adds events; it does not erase.
- Visible History contains active habit actions, not raw events. Global preferences
  persist outside History/Undo and must preserve Redo. Consecutive same-field/date
  edits group for two minutes of inactivity; Undo/Redo close the group and net-zero
  groups disappear. Keep legacy v1 replay semantics and fixtures unchanged.
- Restores validate fully, require a concrete native confirmation, and retain a
  pre-restore copy atomically. Never delete a database to recover silently.

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
a preview by long-pressing the month/year label or a dialog/panel title; dated images are
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
