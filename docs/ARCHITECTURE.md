# Architecture

## Implemented foundation

One React Native screen written in strict TypeScript, running under Expo SDK 57.
It uses a subscribed change store for persistent dated entries, habit colours,
and haptic preferences, with safe areas for phone notches/home indicators. The app uses pure black with bright
per-habit colours. Habit names open a colour picker and statistics placeholder.
A local-midnight timer and foreground check update the current day.

```text
index.ts       registers the app with Expo
App.tsx        screen, dialogs, optimistic store actions and backup confirmations
src/storage/   versioned event/replay model, SQLite transactions, queue and backups
src/usePersistentStore.ts  store subscription, opening and foreground retry
src/AppPanel.tsx  native History/Settings sheets, keeping the grid mounted
src/HistoryView.tsx  compact action rows, pinned controls, sticky day headings
src/history.ts  edit-day grouping and action/effective-date presentation
src/Icon.tsx   code-native outline icons rendered with react-native-svg
src/HabitGrid.tsx  compact toolbar, fixed names/date headers; virtualized date columns and future pull feedback
src/gridLayout.ts  adaptive name/day widths from measured space and text scale
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
backend, account flow, implemented statistics, scheduler, analytics SDK,
or navigation library. The web target is a development convenience; iOS is the
release target. Android is not part of the committed release scope.

## Grid behaviour

Two Reanimated horizontal FlatLists keep date headings and cells aligned. Their
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
explicitly remounts at today, collapses future columns, and restores the pull
boundary without deleting entries; it cancels any pending reveal. Rotation also
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
active change rather than deleting it. History shows actual changes, including
corrections and undo/redo. Settings exports/restores a checksum-validated JSON
change archive; confirmed restore atomically retains a pre-restore copy.

The local-midnight boundary remains the current default; recorded date keys do
not change during travel. No comments, habit management, permanent erasure, or
statistics semantics have been added. See [STORAGE.md](STORAGE.md) for the exact
schema, file contract, limits, failure policy, and recovery limitations. Browser
preview uses a separate localStorage adapter; SQLite is the native iOS store.

Revisit backend/sync only if agreed requirements need them. Widgets/native
extensions can require a development build and native configuration; evaluate
separately from the list.

## History presentation

HistoryView uses React Native SectionList with sticky day headings and compact,
expandable rows (minimum 54 points at default text size). Icons distinguish checked,
unchecked, numeric, cleared, colour, haptic, undo, and redo actions. Text retains
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
Numeric corrections show before → after and units, and colour corrections show
a pair of swatches. Different effective dates get a small For-date caption;
regular same-day entry rows avoid repeating the date.

[React Native SectionList reference](https://reactnative.dev/docs/0.86/sectionlist).
