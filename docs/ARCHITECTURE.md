# Architecture

## Implemented foundation

One React Native screen written in strict TypeScript, running under Expo SDK 57.
It uses React state for a disposable list interaction and safe-area handling for
phone notches/home indicators. It follows the system colour preference. Dates are fixed at demo launch; automatic
date rollover is not implemented. Habit names open an explicit statistics placeholder.

```text
index.ts       registers the app with Expo
App.tsx        12 sample rows × three dates; checkboxes and numeric total entry
app.json       display name, platform configuration, template assets
assets/        generated placeholder icons; replace before release
docs/          setup, decisions, test and release plans
src/dev/       optional native screenshot gesture, excluded from release JS
scripts/       local preview receiver and its integration tests
```

There is no database, backend, account flow, implemented statistics/history, scheduler, analytics SDK,
or navigation library. The web target is a development convenience; iOS is the
release target. Android is not part of the committed release scope.

## Proposed next step — after product discovery

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
