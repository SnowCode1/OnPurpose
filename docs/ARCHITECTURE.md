# Architecture

## Implemented foundation

One React Native screen written in strict TypeScript, running under Expo SDK 57.
It uses a subscribed change store for persistent dated entries, habit colours,
and haptic preferences, with safe areas for phone notches/home indicators. The app uses pure black with bright
per-habit colours. Habit names open recent statistics; hold for anchored actions and drag-to-reorder.
A local-midnight timer and foreground check update the current day.

```text
index.ts       registers the app with Expo
App.tsx        screen coordination, habit actions and nested native presentations
src/useDailyEntryActions.ts  stable grid/statistics input actions and fresh save preconditions
src/NumericRecordDialog.tsx  local numeric draft, validation, suggestions and Done/Close
src/useBackupActions.ts  native backup confirmations, busy guard and error handling
src/storage/   versioned event/replay model, SQLite transactions, queue and backups
src/usePersistentStore.ts  store subscription, opening and foreground retry
src/AppPanel.tsx  native History/Settings sheets, keeping the grid mounted
src/HistoryView.tsx  compact action rows, pinned controls, sticky day headings
src/history.ts  edit-day grouping and action/effective-date presentation
src/Icon.tsx   code-native outline icons rendered with react-native-svg
src/HabitGrid.tsx  compact toolbar, fixed names/date headers; virtualized date columns and future pull feedback
src/gridLayout.ts  adaptive name/day widths from measured space and text scale
src/useGridDates.ts  bounded date windows, navigation, rotation frames and readiness
src/DateColumns.tsx  native recycler/web adapter and frozen initial index
src/HabitContextMenu.tsx  anchored menu appearance and local height measurement
src/useGridScroll.ts  Reanimated UI-thread synchronization and release handlers
src/gridNavigation.ts  pull threshold and scroll-offset-to-calendar-day mapping
src/calendar.ts   local calendar keys and signed date arithmetic
src/ColourPicker.tsx  presets, native sliders, custom preview and hex input
src/haptics.ts   nonblocking native feedback for accepted actions
src/colors.ts   OKLCH/sRGB conversion, gamut mapping and contrast helpers
src/useLocalToday.ts  midnight and foreground date refresh
src/habits.ts   typed demo habits and colour palette
app.json       display name, platform configuration, template assets
assets/        generated placeholder icons; replace before release
docs/          setup, decisions, test and release plans
src/dev/       optional native screenshot gesture, excluded from release JS
scripts/       local preview receiver and its integration tests
```

Native SQLite and a real change-history browser are implemented. There is no
backend, account flow, scheduler, analytics SDK,
or navigation library. The web target is a development convenience; iOS is the
release target. Android is not part of the committed release scope; the founder
started Android porting and device testing on 8 October 2026 (see DECISIONS.md).

## Grid behaviour

Two Reanimated horizontal FlashLists recycle native date headings and columns;
web retains its FlatList layout path. Both keep date headings and cells aligned. Their
scroll handlers run on the UI thread and synchronously move the follower list;
only the end-of-drag/momentum date is sent back to React. This removes the old
JavaScript per-frame scroll command and date-state loop identified while
investigating jitter. Actual smoothness must be judged on the phone.

Lists are inverted with the newest available date at the right edge. Initially
that is today. Releasing a direct pull at least 64 points beyond the native scroll
boundary unlocks 30 future dates. The release distance determines how far to
continue (normally tomorrow beside today), independently of the viewport width. A fling
reaching the boundary does not unlock dates. The iOS rubber-band supplies
resistance; a UI-thread border streak follows the pull and the threshold haptic marks readiness.
At the new future edge, another pull reveals the next batch. The month menu also
offers future access without a gesture, including for accessibility and web.
Future entries use the same habit ID/local-date keys as past entries.

Older dates append in batches of 90. Columns remain virtualized. A vertical
ScrollView moves names and cells together while date headings remain visible.

Row heights are measured from habit names/units so wrapped names and larger text
remain aligned. Measured width and system text size determine the number of whole
columns, with a minimum day width of 48 points (scaled for larger text). Name
width is bounded so landscape gives its extra space to dates. The screen uses
both orientations and safe areas, including dialogs. The month/year beside the
day headings describes the visible period, including month/year boundaries.

Dates snap to column boundaries. A Today action appears only while browsing the
past or future; its reserved space prevents layout shifts. Width changes remount both date
lists with a frozen initial index anchored to the previously rightmost day.
Adding future dates keeps both native lists mounted, preserving visible date
positions with `maintainVisibleContentPosition` and stable date keys. Once both
content-size callbacks confirm the new range is laid out, the body animates to
the nearest column corresponding to the released pull; its UI-thread handler
drives the header. A new drag takes priority over that animation. No frame loop
or timer is added on the JavaScript thread. The explicit future menu action
reveals one day beyond the old edge with the same transition.

See [React Native’s content-position preservation](https://reactnative.dev/docs/scrollview#maintainvisiblecontentposition).
Dates are only prepended/appended during range expansion, never reordered.
Because inverted lists use transforms, validate the native anchoring on the
phone, particularly while expanding a second future batch.

Changing width or the future range resets scroll ownership. Returning to Today
animates to its column, then collapses future columns and restores the pull
boundary without deleting entries; it cancels any pending reveal. Distant navigation
first replaces the bounded date window rather than mounting intervening years. Rotation also
cancels a pending transition and anchors to its logical date. Current-day changes remount the grid at today while values retain
their habit ID/local-date keys.

## Compact top bar and panels

The founder chose an always-visible compact bar and rejected placing the date
there with Today in the grid corner. The final layout keeps ONPURPOSE at left,
Today centred in reserved space, and two 44-point History/Settings icon targets
at right. Three equal flex regions keep Today at the geometric centre. Month/year
returns to the name-column corner beside the day headings and opens the existing
date menu. Date headings retain ordinary scrolling behaviour.

Future pull feedback is text-free: a gradient streak overlays the existing
divider beneath the date headings, where habit rows start. No new top border is
added. Its right endpoint stays fixed while its width grows leftwards with the
pull, up to the date-column viewport width at readiness. It retains the last
width during a 180-ms release fade. A single #8A8A8A grey with alpha ramping
from zero at left to full at right gives monotonic brightness, without a white
hotspot or a dimmer right cap. There is no translation or repeating shimmer.
All updates run on the UI thread; the default system Reduce Motion policy applies
to the fade. The single threshold haptic remains and no overlay covers controls.

Month and year are separate Text elements with a four-point gap inside one
Pressable date button, restoring the earlier two-line layout. The opt-in
DevPreviewButton uses the same capture hook as DevPreviewText, so a long press on
that date button shares a preview and a short press opens the date menu through
one recognizer. Both development wrappers remain excluded from release JS.

App owns the selected panel and visibility separately so closing preserves panel
content throughout its native dismissal animation. AppPanel uses a pageSheet
Modal with Close and iOS swipe dismissal; it has a local safe-area provider and
scrollable content for larger text/landscape. The grid remains mounted behind it.
History now lists stored changes with undo/redo. Settings has a persisted haptic
preference and backup export/restore controls. The module’s enable flag
is read at each feedback event, including future-threshold events bridged from
the UI thread. Preview capture’s tool-success haptic remains independent.

The opt-in preview gesture lives on ONPURPOSE, the month/year label, or panel/dialog
titles. Its onPress opens the date menu; its long press shares the preview.
The release guard still excludes capture code. Icons are own SVG geometry,
without an icon font, rendered by Expo-compatible react-native-svg.

## Colour and typography

Unused future cells use a dimmer version of their habit colour. History keeps
normal emphasis through day 4, then fades smoothly from day 5 to day 8. The fade
is based on signed calendar age and stays bounded thereafter. Checkbox outlines,
empty numeric marks, separators, and unused date headings follow that emphasis.
Recorded checkbox/numeric values retain full colour, including explicit numeric
zero. A date with any recorded value keeps its heading bright. Clear/undo restores
the empty treatment immediately.

Empty-cell alpha is first resolved against black; only OKLCH lightness is then
reduced, by up to 30%. Hue and chroma stay fixed. Lightness has a floor of 0.38 for
empty cells and 0.56 for date text unless the original was already darker. If the
requested lightness cannot represent the same chroma/hue in sRGB, use the darkest
available lightness along that path. Dimming is computed during rendering; no
new per-frame scroll work is introduced.

Presets and Custom tabs show one colour mode at a time to avoid a tall dialog.
The 24 presets occupy four rows at the usual phone width. Done stays outside the
scrolling dialog body. Native sliders expose
Hue, Colourfulness, and Lightness; internally these map to OKLCH (the cylindrical
form of OKLab). Tracks interpolate sampled gamut-mapped colours using native
linear gradients. All selections remain drafts until Done applies the colour and closes the dialog.
Close discards preset, slider, and hex changes; invalid hex disables Done. The
single Done footer and close header stay outside the scrolling dialog body. The
grid is memoized with stable action callbacks to avoid rerendering it on colour
slider changes. Hex accepts three or six RGB digits with an optional
hash and stores a normalized six-digit value.

Out-of-sRGB colours reduce chroma while preserving OKLCH hue/lightness. A contrast
hint flags hard-to-read choices on black; custom colours are not silently replaced.
Filled checkmarks use whichever of black/white has higher contrast. Colour math
uses [Ottosson's published OKLab matrices](https://bottosson.github.io/posts/oklab/).
This is sRGB output, not wide-gamut Display P3 storage.

No custom font family is set or font files loaded. iOS uses its system font
([San Francisco](https://developer.apple.com/fonts/)); names use medium 15-point text, dates semibold 19-point text,
and numeric cells medium 18-point tabular figures. System text scaling remains
enabled. Font alternatives are a future visual comparison, not a selected change.

## Haptic feedback

The existing Expo Haptics dependency supplies native feedback. `src/haptics.ts`
centralizes single-pulse confirmation (Medium), undo/clear (Soft), selection ticks,
and the future-pull threshold (Medium). Android uses native semantic haptic
constants; web previews stay silent. Calls catch native failures and never block
state changes. Haptics run from event handlers, not render, effects, or state
updaters, so replayed updater functions cannot duplicate them.

Checkbox feedback follows completion/undo. Opening numeric entry gets a selection
tick; changed numeric saves and clears use confirmation/undo. A changed colour's
Done confirms, while preset/tab changes get selection ticks. Unchanged saves,
unchanged selections, Close/Cancel, typing, and continuous sliders are quiet.
A deliberate Today jump or future menu action gets a selection tick.

Future pulls track dragging and whether the threshold has ticked on the UI thread.
Only the active list can request it, once per drag. A fling, follower list event,
or recrossing the same threshold cannot generate repeated ticks. Release after
that tick reveals dates without an extra pulse. Haptics use the JS bridge only
for this discrete threshold event; scroll synchronization remains on the UI thread.

Settings exposes a persisted haptic toggle, enabled by default. Feedback
follows both this preference and OS availability. [Expo's haptics reference](https://docs.expo.dev/versions/v57.0.0/sdk/haptics/)
documents cases such as iOS Low Power Mode and system settings suppressing output.

## Durable local storage

SQLite stores an append-only ordered change log and a derived current-state JSON
projection. One transaction commits both. The store immediately updates the UI,
serializes native writes, retains pending edits on failure, and exposes retry.
Loading never renders an editable demo over saved data. The initial sample habits
are seeded only when creating a genuinely new database.

Versioned events preserve before/after values, explicit effective calendar dates,
UTC edit instants, stable IDs, sequence, and time-zone metadata. Replay validates
causality and reconstructs undo/redo stacks. Undo appends the inverse of the latest
active grouped action rather than deleting source events. History projects active
habit actions; Undo removes the row and Redo restores it. Global preferences stay
in storage without appearing in History or affecting habit Undo/Redo. Settings
exports/restores a checksum-validated version-9 JSON
change archive; confirmed restore atomically retains a pre-restore copy.

The local-midnight boundary remains the current default; recorded date keys do
not change during travel. Habit management is implemented; comments, permanent erasure, targets, schedules,
and streak semantics remain separate work. See [STORAGE.md](STORAGE.md) for the exact
schema, file contract, limits, failure policy, and recovery limitations. Browser
preview uses a separate localStorage adapter; SQLite is the native iOS store.

Revisit backend/sync only if agreed requirements need them. Widgets/native
extensions can require a development build and native configuration; evaluate
separately from the list.

## History presentation

HistoryView uses React Native SectionList with sticky day headings and compact,
expandable rows (minimum 54 points at default text size). Icons distinguish checked,
unchecked, numeric, cleared, and colour actions. Text retains
meaning; each whole row exposes one VoiceOver label, including old/new colour
values and any effective entry date. Dark custom colours use a neutral icon
fallback so the action remains visible. Rows have no fixed height or truncation.

Day/time labels use the viewing device's local zone consistently. The recorded
zone metadata and the original habit date remain intact in storage. Group adjacent
same-day records in reverse sequence; never sort the log by timestamps or move
an edit to a different position after a clock change. Loading older records can
extend the last section without changing its key or dropping entries. The local
midnight hook refreshes Today/Yesterday headings while History is open.

Undo/Redo are compact labelled icon buttons with at least 44-point height. Save
status and retry remain explicit above the list; closing preserves the grid.
The next Undo target appears beneath the controls. Actions come from replay's
active undo stack, with consecutive same-field/date corrections coalesced during
a two-minute inactivity window. Net-zero groups vanish; raw edits remain saved.
Redo restores the action's original time/order; its latest mutation sequence
marks it pending until the new event commits. Preferences never become rows.
Numeric corrections show before → after and units, and colour corrections show
a pair of swatches. Different effective dates get a small For-date caption;
regular same-day entry rows avoid repeating the date.

[React Native SectionList reference](https://reactnative.dev/docs/0.86/sectionlist).

## Habit actions and ordering

HabitName combines Pressable taps/holds with native PanResponder drag recognition.
The overlay stays in the grid tree, so opening it does not transfer a held touch
to another native modal. useHabitReorder owns measured row/viewport geometry, an
unsaved order preview, edge scrolling, interruption cancellation, and a Reanimated
floating row. Neighbour layout changes animate; horizontal scroll remains on its
existing UI-thread path. One accepted drop persists one complete order event.

HabitDialog presents statistics, editor, and colour drafts. ManageHabits runs
inside the existing Settings sheet; nested editors are hosted by that same sheet
when needed. See [HABIT_MANAGEMENT.md](HABIT_MANAGEMENT.md) for interaction rules
and version-3 definition/order events, with unchanged v1/v2 replay.

## Habit descriptions

`HabitDetailsScreen.tsx` presents Notes/Statistics tabs; `DescriptionEditor.tsx`
owns full-screen live rich-text writing, and `DescriptionHistory.tsx` compares active
before/after versions. `description.ts` parses Markdown and supplies validation,
summary/preview and insertion helpers. `DescriptionText.tsx` renders native blocks
and intentional OS links without HTML execution or remote image requests.

Descriptions were introduced in v7; new ordinary habit events use v9, with
unchanged SQL schema and v1–v8 replay. `storage/descriptionDraftModel.ts` supplies the separate serialized
draft adapters; platform modules select SQLite/browser storage and sample mode
selects memory. Keep the pure model's name distinct from platform adapters so Metro
cannot resolve it recursively. See DESCRIPTIONS.md and STORAGE.md.

## App-wide typography and change navigation

`Typography.tsx` supplies Text/TextInput wrappers and the app-size provider. Native
font styles get the app multiplier once, with nested spans inheriting and OS
scaling preserved. `useAppWindowDimensions` combines both multipliers for grid
geometry and the DOM description editor. `textSize.ts` owns pure validation and
style calculations; the global preference uses v8 and stays outside History/Undo.

`descriptionChangeNavigation.ts` owns Next change cycling and bounded retries for
unmeasured Before/After passages; manual scrolling and closure cancel pending
work. `editorIconPaths.ts` contains a generated fourteen-icon Tabler subset used
by the DOM SVG `richText/EditorIcon.tsx`, avoiding a full catalogue import.

## Settings structure and optional today filtering

`AppPanel.tsx` retains native sheet/header/history/archive hosting.
`SettingsScreen.tsx` owns the compact settings index and appearance/tracking/
backup/development detail pages. New events/exports use v9; `hideCompleted` is a
preference outside Undo with a compatible false default. Existing v1–v8 records
and SQL schema 1 remain unchanged.

`habitCompletion.ts` defines completion separately from recorded totals. It delegates to `habitGoals.ts` for typed dated rules on all four habit types. HabitGrid selects
a primitive completion mask only when hiding is enabled, ignoring unrelated
writes. At Today it filters displayed rows, offers Show completed, and restores
all rows when browsing other dates. `displayedHabitOrder` persists a full
permutation while keeping hidden and archived slots fixed. UI-thread scrolling,
cell selectors and the fallback backdrop remain in place.

## Description performance and reader trial

`HabitDetailsScreen.tsx` owns the current Notes/Statistics tab trial. It opens
full Notes if present, otherwise Statistics. `useHabitPages.ts` drives native
horizontal paging and the floating bottom switch. The initial panel mounts first, its neighbour warms after 200 ms or input,
then both retain fixed viewport geometry/scroll/state side by side. Native
scrolling and directional locking handle the gesture; shared values drive the
island pill on the UI thread, with only discrete aligned-page changes sent to React.
Inactive panels remain excluded from touch/accessibility. Measured island height
reserves bottom padding in both vertical scrollers.
`descriptionReading.ts` supplies bounded edit/version summaries and full balanced
passages, top-level list-item virtualization and a five-document/100,000-character
read cache. `DescriptionReader.tsx` renders the Notes FlatList without another
Modal/header. `HabitStatsScreen.tsx` owns the Statistics scrolling content and
range/month/chart state. App presents their common native page sheet and nested
editor/version/numeric dialogs, with save failure/retry visible. The previous
compact card and extra reader presentation are superseded.
The DOM editor memoizes initial content and prepares original-byte snapshots.
Per-editor weak caches share serialization for immutable ProseMirror documents;
length validation remains synchronous on each changed document. A pure update
queue batches native text reporting with quiet/deadline/flush/cancel semantics;
position-only callbacks avoid sending unchanged Markdown. Native background
requests exact text and draft writes remain serialized separately from main
History. No persistence or export schema changes are needed. Sample-only
progressive notes live in `dev/sampleDescriptions.ts`.

## Categorical and text values

`entries.ts` supplies `EntryValue` (number/string/string-array), labels, canonical
category sets, text limits and bounded grid previews. `habits.ts` centralizes the
four effective types, retaining legacy unit inference. Storage v10 validates
these shapes, stable category references and deep definition/array equality
while retaining old replay and the same SQLite schema/queue. `DailyRecordDialog`
is nested in the existing App overlays for grid and statistics recording.
`CategoryEditor` edits option drafts independently of daily selections.
`RecordStatsScreen` retains recording range/month state and virtualizes daily
entry rows; `recordStatistics` shares calendar/start rules without interpreting
text or categories as numbers. The old numerical/checkbox statistics stay in
`HabitStatsScreen`. Both screens build their charts from `statsSeries.ts` and
the shared `ChartFrame`-based components (see STATISTICS.md, Charts). Shared
number/date display helpers live in `statisticsFormatting.ts`.

## Effective-dated completion goals

`habitGoals.ts` owns strict timeline validation, binary-search policy selection,
rule summaries and evaluation. `completionStatistics.ts` counts applicable dates
by policy intervals/weeks and derives success streaks independently of calendar
recording metrics. `HabitGoalsEditor.tsx` hosts the native sheet and timeline; `GoalVersionForm.tsx`
retains the form while browsing that timeline. `goalEditing.ts` parses numeric
drafts and explains invalid conditions/dates. `GoalSummary.tsx` shares the compact
Goal entry point in habit editing and Statistics.
Definitions carry optional v11 goals; old log prefixes and SQL schema 1 remain
unchanged. Shared completion filtering changes only when the Today mask changes.
Sample goals are memory-only in `dev/sampleGoals.ts`. See [GOALS.md](GOALS.md).

Archived-habit display facts live in `archivedHabitDetails.ts`: one pass over
record keys derives per-habit counts and first/last dates, retaining saved archived
order. The archive memoizes these facts and bounded note excerpts so save
acknowledgements do not repeat derivation/parsing. `ArchivedHabits` owns native
confirmation; `ChangeStore.deleteArchivedHabit` captures current definitions and
records for the atomic v12 deletion action. History-only deleted metadata never
reenters the current grid or archive.

Version 13 adds saved period/cycle anchors to goal snapshots. `goalTiming.ts`
validates and counts applicable dates by bounded repeating blocks;
`periodStatistics.ts` aggregates recorded dates and empty windows without
allocating lifetime calendars. `PeriodProgress.tsx` renders current/recent results
only in Statistics. `GoalTimingFields.tsx` drafts frequency and optional cycles;
Create/Edit and Goal are full-screen with staged subpages. The old test-value
panel is removed. `dev/sampleTiming.ts` appends isolated v13 sample policies.

## Code organization review (7 October 2026)

The root was mixing screen coordination, daily-entry drafts and native backup
workflows. `useDailyEntryActions` now owns selected habit/day editors and stable
cell callbacks shared by the home grid and statistics. Numeric/text/category
saves use one fresh-store precondition path with accepted-edit feedback and quick
Undo; checkbox taps retain their dated defaults and on/off feedback. Numeric
validation, recent totals and keystrokes live inside the keyed
`NumericRecordDialog`, so typing no longer updates app-root state. Done closes
only on an accepted/unchanged save; Close discards the draft. Both daily dialogs
remain nested inside the statistics presentation when it is open.

`useBackupActions` owns native confirmation, picker/share errors and a synchronous
busy guard for duplicate in-flight actions. It delegates durable/exclusive work
to the existing ChangeStore and backup adapters. No persistence format, replay,
queue, projection or restore-copy semantics changed. Sample mode cannot invoke
these backup actions.

The shared chart no longer lives inside a statistics screen imported by another
screen. Its dated selection, accessible controls, clear action and target drawing
are unchanged. A static local-import scan found no runtime import cycles; it does
not inspect dynamic requires or establish native runtime behaviour.

Generated icon catalogues account for the largest files and should stay generated.
ChangeStore is a focused 224-line coordinator. The following continuation separates
model validation from replay and extracts the grid's date controller; see below.
Do not split generated data or feature forms solely to reach a line-count target.
These passes add no dependencies or framework.

## Grid and storage responsibility boundaries

| Module              | Responsibility                                                                                                  |
| ------------------- | --------------------------------------------------------------------------------------------------------------- |
| HabitGrid           | Measured outer width, habit rows, reorder controls, toolbar and cell render callbacks                           |
| useGridDates        | Cached/bounded dates, Today/date/future navigation, paired native generation readiness and resize anchoring     |
| useGridScroll       | UI-thread list synchronization, actual offsets, pull thresholds and reduced-motion-aware arrival                |
| DateColumns         | Native recycler/web FlatList adapter, retaining native initial index until the existing generation key remounts |
| HabitContextMenu    | Menu appearance, local height measurement and placement; held names remain reachable                            |
| storage/types       | Event, change, state and replay TypeScript shapes; no runtime logic                                             |
| storage/changeUtils | Classification, equality and inverse values shared by validation/replay/writes                                  |
| storage/validation  | Strict shape/version validation and state-precondition assertions                                               |
| storage/model       | Public compatibility facade, deterministic transitions, grouping and replay                                     |

The grid remains one mounted state owner: moving hooks into useGridDates does not
introduce another state store, per-frame callback or remounted screen. Its date
objects retain their cache identities. The outer layout handler cancels reorder,
prepares the current native date anchor, then changes width. Header and body keep
their existing width/range keys and shared starting offset. Current viewport plus
native drawing readiness releases columns; web still uses fixed content sizes.

Context-menu height is local to the always-mounted menu component, so native menu
measurement no longer updates the grid parent. Only the original Animated.View
subtree appears/disappears, preserving transition and press/hold hit regions.

Existing storage consumers continue importing model.ts. It reexports the same
public types and helpers. Validation imports types/utilities, never model/replay,
so splitting it does not introduce a runtime cycle. Types, error messages,
version gates, immutable live updates, mutable startup replay and all event
prefixes are unchanged. No schema, writer version or persisted data is changed.
