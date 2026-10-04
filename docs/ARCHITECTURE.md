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
src/HabitGrid.tsx  fixed names/date headers; virtualized past-only date columns
src/calendar.ts   local calendar keys and past-date arithmetic
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

Two synchronized horizontal FlatLists keep date headings and cells aligned.
They are inverted so index zero is today at the right edge; only non-negative
past-day offsets exist. Bouncing beyond today is disabled. Older dates are
appended in batches of 90 as needed, with column virtualization to avoid rendering
every historical cell at once. A vertical ScrollView moves names and cells
together while date headings remain visible.

Row heights are measured from habit names/units so wrapped names and larger text
remain aligned. Three columns are visible normally, two for larger text or narrow
layouts. Dates snap to column boundaries, and a Today control resets horizontal
position without changing habit order. Current-day changes remount the grid at
today while values retain their habit ID/local-date keys.

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
