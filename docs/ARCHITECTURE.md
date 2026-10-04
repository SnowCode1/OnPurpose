# Architecture

## Implemented foundation

One React Native screen written in strict TypeScript, running under Expo SDK 57.
It uses React state for disposable dated entries and habit colours, with safe
areas for phone notches/home indicators. The app uses pure black with bright
per-habit colours. Habit names open a colour picker and statistics placeholder.
A local-midnight timer and foreground check update the current day.

```text
index.ts       registers the app with Expo
App.tsx        screen, in-memory state, colour picker and daily-total editor
src/HabitGrid.tsx  fixed names/date headers; virtualized date columns and future pull feedback
src/gridLayout.ts  adaptive name/day widths from measured space and text scale
src/useGridScroll.ts  Reanimated UI-thread synchronization and release handlers
src/gridNavigation.ts  pull threshold and scroll-offset-to-calendar-day mapping
src/calendar.ts   local calendar keys and signed date arithmetic
src/ColourPicker.tsx  presets, native sliders, custom preview and hex input
src/colors.ts   OKLCH/sRGB conversion, gamut mapping and contrast helpers
src/useLocalToday.ts  midnight and foreground date refresh
src/habits.ts   typed demo habits and colour palette
app.json       display name, platform configuration, template assets
assets/        generated placeholder icons; replace before release
docs/          setup, decisions, test and release plans
src/dev/       optional native screenshot gesture, excluded from release JS
scripts/       local preview receiver and its integration tests
```

There is no database, backend, account flow, implemented statistics/history, scheduler, analytics SDK,
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
boundary reveals 30 future dates, starting with the next screenful. A fling
reaching the boundary does not unlock dates. The iOS rubber-band supplies
resistance; a UI-thread progress line and release label expose the threshold.
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
Changing width or the future range resets scroll ownership. Returning to Today
collapses future columns and restores the pull boundary without deleting entries. Current-day changes remount the grid at today while values retain
their habit ID/local-date keys.

## Colour and typography

Unused future cells use a dimmer version of their habit colour. History keeps
normal emphasis through day 4, then fades smoothly from day 5 to day 8. The fade
is based on signed calendar age and stays bounded thereafter. Checkbox outlines,
empty numeric marks, separators, and unused date headings follow that emphasis.
Recorded checkbox/numeric values retain full colour, including explicit numeric
zero. A date with any recorded value keeps its heading bright. Clear/undo restores
the empty treatment immediately.

Empty-cell alpha is first resolved against black; only OKLCH lightness is then
reduced, by up to 30%. Hue and chroma stay fixed. Lightness has a floor of 0.5 for
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

## Proposed next step — durable storage

Separate the Today screen, habit domain logic, and local storage when we add real
habits. Prefer a small number of clear modules over a framework of abstractions.
Incremental change storage is a confirmed requirement; SQLite with an append-only
log and derived current-state tables is the proposal in STORAGE.md.

Use stable habit IDs and explicit user ordering. Store completion by habit and
local calendar date rather than destructively clearing yesterday's state at
midnight. Date boundaries, late-night habits, travel, backdating, and archival
semantics need decisions and targeted tests before shipping.

UI feedback must not wait for a network round trip. Persistence must handle
rapid taps without losing writes, expose failures honestly, and never overwrite
saved data with an empty initial state during loading. Plan schema migrations
and export/replay/recovery before collecting meaningful history.

Revisit navigation once there is more than one real screen. Revisit backend and
sync only if agreed requirements need them. Widgets/native extensions can require
a development build and native configuration; evaluate separately from the list.
