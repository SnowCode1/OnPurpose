# OnPurpose contributor and agent guidance

## Start here

Read `PROJECT_GOALS.md`, `docs/DEVELOPMENT.md`, and `docs/DECISIONS.md`.
OnPurpose is a provisional name. The founder is new to the stack: explain
technical choices in plain language and connect them to the product goal.

## Duplicate messages

The Codex client sometimes repeats a user message. When a message clearly
repeats one already handled and adds no new instruction, ignore it or reply with
one brief acknowledgement. Do not repeat the explanation, restart completed work,
or run the same mutation twice. Continue when the next substantive message arrives.
Treat deliberate requests to retry or repeat an action as new instructions.

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
- `src/AppPanel.tsx` owns real change History/undo and the Settings/backup sheet; `src/SettingsScreen.tsx` owns the compact settings index and detail pages; `src/Icon.tsx` owns outline icons.
- `src/HistoryView.tsx` renders compact action rows and sticky edit-day groups;
  `src/history.ts` keeps grouping separate from effective habit dates. Preserve
  reverse sequence order; do not reorder logged actions by their timestamps.
- `src/HabitName.tsx` and `src/useHabitReorder.ts` own hold/menu/drag interactions.
  Only completed drops persist. Keep cells distinct, support cancellation, and
  preserve archive entries. `src/HabitDialog.tsx` owns editor/colour drafts;
  `src/ArchivedHabits.tsx` owns the Settings archive/restore list. Add belongs at the
  end of the grid. `src/HabitStatsScreen.tsx` owns full-screen statistics, with pure
  calculations in `src/statistics.ts`. Read HABIT_MANAGEMENT.md and STATISTICS.md.
  `src/HabitDetailsScreen.tsx`, `src/DescriptionReader.tsx`, `src/DescriptionEditor.tsx` and `src/DescriptionHistory.tsx`
  own description reading, full-screen draft editing and Before/After restore.
  `src/DescriptionVersions.tsx` lists that habit's active note actions using the pure
  `descriptionVersions.ts` filter; retain repeated content and reverse sequence order.
  Restore only description onto the current definition. `richText/selection.ts`
  reads whole-selection highlight/link state; `descriptionLinks.ts` shares explicit
  native opening between reader/editor. `descriptionDiff.ts` compares intact Markdown
  passages with a bounded matrix; keep unchanged passages quiet and reader rows
  virtualized. `richText/clearFormatting.ts` preserves link marks when clearing styles.
  `richText/useEditorPosition.ts` restores once and debounces scroll/selection reporting;
  pair locations with exact text, outside History/backups. v2 local drafts/bookmarks
  retain v1 reads and the separate draft SQL schema. Read
  `docs/DESCRIPTIONS.md`. `src/RichDescription.tsx` is the offline Expo DOM/Tiptap
  editing surface; `src/richText/` owns safe document mapping, formatting, local
  Undo/Redo and bounded highlights. Preserve native readers and request a current
  DOM snapshot before applying. Applied descriptions use ordinary habit changes (v12 for new writes);
  recoverable drafts stay outside History/backups in a separate local store. Keep
  `storage/descriptionDraftModel.ts` distinct from native/web adapters for Metro.
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
- `useGridDisplayPreferences.ts` holds only grid display preferences while the
  History/Settings/archive sheet is presented or dismissing. Settings and storage
  use current values immediately; native `AppPanel.onDismiss` releases the latest
  values together. Keep the mounted grid and its inner TypographyProvider stable.
  Do not defer durable writes, unmount the grid, or rebuild hidden day lists on
  every spacing/text-size choice.
- `src/rowSpacing.ts` owns saved Compact/Standard/Roomy geometry; preserve font scaling and measured row heights.
- `src/StartDateField.tsx` owns the native draft date picker; existing dates remain inferred until edited. Explicit start dates bound statistics without deleting entries. New edits/exports use v12, retaining v1–v11 replay.
- Statistics uses the same native pageSheet/slide/swipe dismissal as History and
  Settings; UIKit owns its gesture. `App.tsx` nests numeric, habit, description
  and version dialogs inside the statistics presentation and preserves visible
  save failure/retry. Keep an accessible Close button and the underlying grid.
  Do not reintroduce sideways entry or a separate JS overscroll threshold.
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

- `src/Typography.tsx` shares app-wide Text/TextInput scaling and combined layout
  font scale; `textSize.ts` owns validated 85–150% steps. Use these wrappers for
  app text and preserve OS scaling/nested-span inheritance. Preferences remain
  outside History/Undo. The DOM editor uses the same combined font scale.
- `descriptionChangeNavigation.ts` owns cancellable Next change navigation; retain
  bounded retries for unmeasured passages and respect reduced motion. Editor
  outline SVGs use the generated small `editorIconPaths.ts` subset; regenerate with
  `scripts/generate-editor-icons.mjs`, not a full catalogue import into the DOM.

## UI and accessibility

Keep completed rows in place by default. Optional Hide completed today filters rows meeting their effective-dated goals at Today. Preserve Show completed and full rows when browsing other dates. Avoid gesture-only essential actions. Expose
checkbox state and meaningful labels to accessibility services. Permit font
scaling, respect safe areas, and allow scrolling when content needs it.
Do not trade reliability or readable controls for the three-second aspiration.

## Verification

Run `npm run check` and relevant `npm test` suites after code changes, and `npm run export:ios` when changing
native-facing imports or Expo config. Web preview helps layout checks but is not
evidence that iOS runs correctly. Report actual checks and any unverified device
behaviour. Follow `docs/TESTING.md` for phone and release testing.
Keep the npm test heap/concurrency/time limits. Diagnose runaway tests under a
hard memory limit; avoid DOM assertions that print entire jsdom browser graphs.
Add focused tests when persistence, date logic, event replay/export, or other consequential behaviour
arrives; avoid tests that merely duplicate trivial markup.

For phone screenshots, read `.dev/previews/latest.png` after the founder shares
a preview by turning the phone face down until a tap, then back toward them and
pausing (title holds remain optional); dated images are
alongside it. Preview settings are in ignored
`.env.local`. Use `npm run preview:server` for the local receiver. Do not commit
captures or pairing tokens. Run `npm run test:preview` after changing the receiver;
preserve both the env flag and `__DEV__` guard around preview capture.
`src/dev/DevPreviewCapture.tsx` mounts once for all screens, samples motion only
while active and never updates React per sample. `previewMotion.ts` validates
intentional holds/settling/deadlines/cooldown. `previewCapture.ts` shares one busy
gate and retains one failed image for Retry; `previewUpload.ts` distinguishes
network/capture/receiver errors. No sensor or screenshot data enters habit storage.
Settings exposes an accessible dev-only fallback. Keep all these modules out of
release JS and never print pairing tokens.

## Documentation and release

Update relevant docs when changing commands, architecture, or confirmed scope.
Keep credentials, signing files, tokens, local logs, and real user habit data out
of Git. `EXPO_PUBLIC_*` variables are public in the app, not secret storage.
Keep deployment and signing manual until release automation is deliberately set
up. Do not claim App Store readiness from a successful JavaScript bundle export.
Preserve the Expo template notice in `docs/licenses/EXPO_TEMPLATE_LICENSE.txt`.
Project licence, pricing, final bundle identifier, and final brand remain open.

`src/habitCompletion.ts` centralizes completion rules; do not infer completion
from a record without an explicit rule; use its effective date and keep blank distinct from zero.
`completedHabitsSelection` uses a primitive today mask; disabled filtering,
non-crossing numeric edits and save acknowledgements must not rerender the grid container.
`displayedHabitOrder` fills only displayed slots and preserves hidden/archived
positions while saving a full undoable permutation. `hideCompleted` is a v9
preference outside History/Undo, defaulting to false for older logs.

`HabitDetailsScreen.tsx` owns the Notes/Statistics tab trial in one native sheet.
Name taps open full Notes when present, Statistics otherwise. `useHabitPages.ts`
owns native horizontal paging and the floating bottom switch. Mount the first
panel immediately, warm its neighbour after 200 ms or navigation, then retain
fixed viewport geometry/scroll/range state. Native directional locking handles
gesture arbitration, shared values animate the island pill, and React receives
only discrete aligned-page changes. Reserve bottom content padding from measured
island height, preserve font scaling, rotation and reduced motion; inactive panels
must not accept input or appear in accessibility. Copy native layout dimensions
synchronously before functional state updates; React Native pools the event.
The compact-card experiment is superseded. `descriptionReading.ts` bounds excerpts and
virtualizes top-level list items with intact nesting/numbering. Keep its disposable
cache capped at five documents/100,000 characters. `sampleDescriptions.ts` owns
long fictional notes on Walk/Read/Meditate only in the isolated sample store;
never migrate those into real habits. The DOM editor memoizes initial parsing and
uses weak immutable-document serialization caches. Full length validation stays
synchronous. `descriptionUpdateQueue.ts` batches bridge reporting only (200 ms
quiet, one-second deadline); keep exact Done/Close/background snapshots and
position-only reporting separate from local typing/Undo and main History.

First editor opens place caret and viewport at the start. Matching-text bookmarks
still resume. Observe writing viewport and editor content through keyboard resize,
stop restoration on deliberate user input, and keep scroll inside the writing
area. Opening editor feedback must stop on readiness or an explicit load error.

`entries.ts` owns daily value types (number/text/category IDs), canonical sorted
multi-selection, labels and bounded cell previews. `CategoryEditor.tsx` drafts
stable category IDs/labels/short labels and archives options without erasing
records. `DailyRecordDialog.tsx` applies text/multiple selections only on Done;
Close cancels. `RecordStatsScreen.tsx` and pure `recordStatistics.ts` show logging
counts/streaks, category frequency, editable calendar and virtualized entries,
without claiming completion. `habitCompletion.ts` delegates all four types to effective-dated conditions in
`habitGoals.ts`; absent non-checkbox goals remain Track only. `sampleRecords.ts` appends
fictional Workout/Highlight examples only to the isolated sample store, leaving
the original v7 sample fixture and real presets untouched. Main log/export v12
retains unchanged v1–v11 prefixes; array preconditions/grouping/inverses compare
values rather than references. SQL stays at schema 1. Grid text/category cells
use readable 12-point text with app/OS scaling, native tail truncation and
geometry-based 1–3 lines from `gridEntryText.ts`. Only numeric cells may autosize;
our iOS renderer ignores the advertised `minimumFontScale` floor.
Do not infer native text fitting from browser captures. Comments remain deferred.

`HabitGoalsEditor.tsx` owns the native Goal sheet, timeline and draft navigation;
`GoalVersionForm.tsx` owns grouped condition/repeat/date inputs and local tests.
`goalEditing.ts` validates incomplete drafts without weakening storage validation.
`GoalSummary.tsx` is the shared Goal entry point. Open the form directly, preserve
drafts while browsing the timeline, confirm before replacing dirty drafts, and do
not persist unchanged default goals. Checkbox cells use the same completion tint
as the other types. The enclosing habit editor passes its draft identity and start date. Read `docs/GOALS.md` before
changing completion/statistics. Preserve dated rules/schedules, stable version and
category IDs, earlier-period confirmation, ordinary undoable definition edits,
unchanged values and v1–v10 prefixes. `completionStatistics.ts` counts scheduled
opportunities without allocating lifetime calendars; numeric averages still use
all calendar days. `dev/sampleGoals.ts` adds fictional goals only to the isolated
sample log. Weekly quotas, skipping and manual overrides remain deferred.

Archived habit Delete requires a named native confirmation and uses the v12
`deleteHabit` snapshot action through `ChangeStore.deleteArchivedHabit`.
Undo restores the full definition, every daily record and archived position in
one atomic write. Preserve append-only events, local note drafts/bookmarks,
legacy v1–v11 replay and schema 1. This is recoverable deletion, not permanent
erasure. `historyDisplayState` supplies deleted names/types only for History
labels; description restore still requires the real current habit.

## Period goals and cycles (v13)

Read docs/GOALS.md. `goalTiming.ts` owns strict fixed-period/cycle shapes and
bounded calendar arithmetic; `periodStatistics.ts` owns progress/results and
period streaks. Do not allocate lifetime calendars, infer quotas from entries,
count taps/categories as multiple successful days, or realign saved anchors when
weekStart changes. Off periods and boundary fragments are neutral; Today remains
open. `GoalTimingFields.tsx` owns compact schedule drafts; Try a value is removed.
Create/Edit habit and Goal are full-screen editors with short parent navigation,
fixed actions, safe areas and staged subpage edits. `PeriodProgress.tsx` keeps
quota progress out of the grid. Hide completed remains a daily predicate.
Current writers/exports use v13, retaining v1–v12 replay and schema 1. Older event
versions must reject period/cycle fields. `sampleTiming.ts` appends fictional
timing examples only in the isolated sample store.

Goal editing now starts with four summary sections owned by
`GoalEditorControls.tsx`; only one section opens at a time. Preserve mounted
drafts and hide inactive content from accessibility. Single-choice options open
short lists; keep multi-select weekdays/categories direct. InfoNote owns the
shared subtle top separator/spacing; do not add unrelated per-screen divider hacks.

Checkbox goals now support `unchecked` and dated optional `defaultChecked` in
`habitGoals.ts`. Use `checkboxChecked`/`toggleCheckboxValue` everywhere: saved 0
is an explicit Off override, 1 is On, absent inherits the dated default. Current
writes/exports are v14; v1–v13 keep old validation and exact prefixes. SQL stays 1.
Default changes from habit editing use `withCheckboxDefault`; goal editing stages
the same timeline field. Count implicit successes arithmetically through policies
and repeating periods, never materialize lifetime daily values. Primary goal
section choices open directly; do not nest a duplicate selected-value dropdown.

Current writers/exports are v15. `checkboxStyle` is a strict boxes/marks preference
(default boxes), outside History/Undo, retaining v1–v14 prefixes and SQL schema 1.
`GridCheckboxMark.tsx` scales both styles and owns tap-only UI-thread feedback.
Never animate on cell mount, store acknowledgements, Undo or scroll. Respect
ReduceMotion.System; rapid taps cancel/restart the short non-bouncy sequence.
`WeekDivider.tsx` overlays the saved week-start edge without changing geometry.
Defer checkboxStyle and weekStart with other grid presentation preferences until
Settings dismisses. A separate rest-day feature was declined; keep scheduling in
effective-dated habit goals.
