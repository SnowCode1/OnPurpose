# Incremental local storage

Implemented 4 October 2026. The founder confirmed incremental storage, change-based
export, and undo, and accepted the top-bar UI before this work. The implementation
choices below are technical decisions; scheduling, comments, deletion, and cloud
sync remain separate product decisions. Persistence was confirmed on the physical iPhone; an older-undo report and native
backup/share-sheet acceptance remain under evaluation.

## What is saved

Checkbox entries, numeric daily totals, applied habit colours, and the haptic
preference now survive a reload. The existing 12 sample habits are initialized
once, not on every launch. Habit creation, renaming, units, ordering, and archival now persist as well.
Basic recent-record statistics are available; comments, targets, and streaks remain
later work. See [HABIT_MANAGEMENT.md](HABIT_MANAGEMENT.md).

`src/storage/model.ts` defines version-3 events and deterministic replay, with
backward-compatible interpretation of existing version-1/2 records.
`repository.ts` implements the native database operations against a small SQL
interface; `native.ts` connects it to Expo SQLite and native UUID/SHA-256 support.
`store.ts` owns loading, immediate UI state, the serialized write queue, undo,
redo, and exclusive backup work. React subscribes through `usePersistentStore.ts`.

Habit/day records answer “What did I record for Tuesday?” Change records answer
“What changed, and in what order?” Correcting Tuesday on Wednesday uses Tuesday's
explicit `YYYY-MM-DD` key and Wednesday's edit timestamp. They are never conflated.

## Database version 1

Native data lives in `onpurpose.db` in Expo SQLite's application database directory.
It is local to this app/project; Expo Go and a future standalone build have
separate containers. Uninstalling or clearing the container can remove the data.
There is no server, account, or automatic cross-device transfer.

- `changes`: ordered immutable event JSON, integer sequence primary key, unique ID.
- `current_state`: one derived JSON projection with its last committed sequence.
- `recovery_archives`: complete pre-restore event logs retained locally.
- `PRAGMA user_version = 1`: database schema version, distinct from event/export versions.

SQLite uses WAL and requests FULL synchronous durability. Each normal append
inserts the event and advances the projection in one exclusive transaction.
User-controlled strings are bound SQL parameters, not SQL fragments.

A genuinely new database gets its schema and initial-habit event in one transaction.
An unrecognized nonempty version-zero database, newer database version, invalid log,
or failed integrity check blocks loading. It is never silently reset or re-seeded.
A valid log with a missing/stale/broken projection rebuilds only that derived data.
At startup the full log is validated and replayed, including undo/redo stacks.
Replay owns fresh mutable state to avoid copying the entire history on each event;
live UI updates remain immutable. Native launch performance still needs measurement.

Future database migrations must be explicit transactional steps; reject newer
versions. Future event reducers must continue to interpret existing v1/v2/v3 events.
Do not rewrite old events just to match a newer domain model. Keep tests for old
exports and migration fixtures. Version 1 is the first schema, so there is no
migration from an earlier persisted OnPurpose version.

## Event structure and semantics

Every event carries:

| Field              | Meaning                                                                        |
| ------------------ | ------------------------------------------------------------------------------ |
| `version`          | Event schema version, currently `3`; existing `1`/`2` records remain supported |
| `id`               | Stable UUID generated once, retained on save retry                             |
| `sequence`         | Contiguous order starting at `1`; authoritative even if the clock changes      |
| `recordedAt`       | UTC edit instant in ISO form with milliseconds                                 |
| `timeZone`         | Device time-zone name at edit time, or `unknown` if unavailable                |
| `utcOffsetMinutes` | Local offset east of UTC at edit time                                          |
| `type`             | `initialize`, `change`, `undo`, `redo`, or `preference`                        |

`initialize` records the ordered habit definitions and starts with no entries and
haptics enabled. Each subsequent edit includes `before` and `after` values.
Version-2 `change` events target an entry or habit colour and include a `groupId`.
A new group's ID is its first event's ID; corrections retain that ID. Version-2
`preference` events persist global settings (currently haptics) in the same log
and export, outside habit History and Undo/Redo. Undo targets an active group ID;
Redo targets its latest undo event ID and restores the original action.

Existing version-1 logs retain their original interpretation, including historical
preference undo/redo and abandoned redo branches. Their habit edits remain
individual undo steps, with settings and undo/redo rows filtered from the view.
New events use version 3. A log can progress from versions 1 → 2 → 3, skipping
versions if needed, but never downgrade. New habit-definition changes record
`habitId`, `index`, and `before`/`after` definitions (null for creation/removal).
Order changes record exact before/after ID arrays. Definitions may include an
explicit checkbox/number `type` and an `archived` boolean; legacy numeric habits
remain inferred from their units. Archive preserves entries. Undoing creation
cannot remove a habit while it still has entries, and type conversion is rejected
while values exist. Definition equality ignores JSON field ordering.

Habit-definition and ordering edits are distinct actions and close correction
groups. Reordering validates exact current order and a unique complete permutation;
archived positions remain present. No old events are rewritten, and no database
reset or SQL schema change is required. Older builds must reject v3 data rather
than discard unfamiliar events.

Daily entries use stable habit IDs and explicit calendar dates. Numeric zero is a
recorded value; `null` is absent/cleared. Checkbox values are `1` or `null`, so
unchecking clears the entry. Numeric values must be finite, nonnegative, and no
larger than JavaScript's maximum safe integer; decimals remain supported. Colours
are six-digit sRGB hex. Scroll positions, open panels, typing drafts, cancelled
colour choices, and no-op saves are not history events.

The existing local-midnight boundary remains the implementation default, pending
a separate founder decision about a later cutoff. Recorded dates stay fixed after
travel or time-zone changes; the current Today label follows the device's local
date. Future entries follow the same validation as past/today entries. Streaks,
frequency targets, and historical-target semantics have not been decided here.

Replay rejects missing/reordered sequences, repeated event IDs, unknown versions
or fields, invalid dates/values/colours, unknown habits, failed before-value
preconditions, and incorrect undo targets/inverses. It does not use wall-clock
sorting. Duplicate events in an imported archive are rejected, not merged. Normal
retry of the exact same committed event is idempotent.

## Immediate feedback, saving, and failures

The grid updates immediately; native writes start immediately in a single queue.
Every action computes its before-value from the store's latest state, including
pending edits, rather than a stale render. Rapid taps retain their order. UI taps
and haptics do not wait for disk I/O. This is optimistic feedback, not a claim that
the tap is already durable.

History/Settings show pending saves and then “Saved on this device.” A failed write
retains that event and all later queued events in memory, pauses further changes,
and displays “Changes are not saved. Keep the app open and retry.” Retry resumes
in order using the original event IDs. A transaction failure cannot leave the
projection ahead of the log. If a commit succeeded but its acknowledgement was
lost, retry finds the identical event and does not duplicate it. Foregrounding
retries failed queued saves. Closing/force-killing during pending writes can still
lose the uncommitted queue; no JavaScript app can guarantee completion after being
killed. No background-task reliability claim is made.

Loading shows a quiet black loading view before any editable grid. Loading failure
shows Retry, preserving the database. Permanent log corruption currently requires
developer-assisted recovery; there is no automatic destructive reset or an
in-app corrupt-database replacement tool. Keep an external export before relying
on this preview for irreplaceable data.

## Undo, redo, and History

History is a virtualized sectioned list of active habit actions, newest first, grouped
by edit day in the viewing device's local time zone. Sticky day headings show
Today/Yesterday or a calendar date; rows show the edit time. Entry dates appear as
“For …” when different from the edit day. Compact rows pair action icons with
text, numeric before/after totals, and old/new colour swatches. Undo/Redo and save
status and a description of the next Undo target stay above the list. Older
actions load in batches of 100, retaining contiguous action order if a clock
adjustment causes a date to recur. Initialization and global preferences are not
shown. Habit colours remain visible and undoable. It is a change browser, not yet
a historical whole-screen snapshot/reconstruction interface.

Undo reverses the latest active action and appends an `undo` event referencing it.
Redo reapplies that action and appends a `redo` event. The visible row disappears
on Undo and returns with its original identity, order, and edit time on Redo;
undo/redo never create extra rows. Both validate the exact net change and current
before-value. The stacks are reconstructed from events and survive reopening,
export, and restore. New habit edits clear the redo branch without deleting its
events. New preferences neither enter Undo nor clear Redo.

Consecutive edits to the same habit field coalesce while less than two minutes
have elapsed since its latest edit. Entries must also have the same effective
date. Each group shows the first before-value and latest after-value, with the
latest edit time. Check/uncheck returning to the original value removes the
active action; another immediate check can resume that group. Every individual
edit still writes immediately to disk. The two-minute window is a grouping rule,
not a save delay. Undo reverses the whole net group in one atomic transaction.

Editing another habit, date, or field starts a separate action and closes the
previous group, preserving chronological undo. Undo/Redo also close the group.
Midnight, time-zone/offset changes, a backwards clock, or two minutes of inactivity
close it. Preferences do not break an otherwise eligible group. Reopening within
the window preserves the group; grouping rules use captured edit-zone metadata,
while list headings use the viewing local zone. Selective undo, gesture batching,
comments, and permanent erasure require later rules.

Undo is not permanent erasure. There is no deletion or erasure UI. Decide
privacy/erasure rules before implementing comments; do not assume append-only
history makes erasure impossible or unwanted.

## Portable backup version 3

Settings → Export backup opens the iOS share sheet; save the JSON to Files or
another destination. The app first waits for pending saves and captures a stable
log. The export is a readable JSON container of **changes**, not a replacement
snapshot of habit/day values. See [the version-3 synthetic example](examples/storage-v3.json),
[version-2 fixture](examples/storage-v2.json), and
[the unchanged version-1 fixture](examples/storage-v1.json).

The container has `format: "onpurpose.changes"`, `version: 3`, `exportedAt`,
`eventCount`, `sha256`, and `events`. The digest is SHA-256 of UTF-8
`JSON.stringify(events)` with its existing property order. It detects accidental
modification/incompleteness; it is not an authenticated signature. Exports are not
encrypted and may reveal habit names, dated values, colours, and preference/edit
metadata. Pre-restore copies are not bundled into the active export. The exporter
always writes container version 3. The importer accepts versions 1, 2, and 3;
a container cannot contain events newer than its own version. New containers can
retain legacy prefixes, including full raw edits and undo/redo operations that
are omitted from the active History view.

Restore backup opens the system document picker, reads the selected cached file,
checks format/version/count/checksum, and fully validates/replays it before asking
for confirmation. The native confirmation states the habit/change counts and
that current entries, colours, and settings will be replaced. Confirmed restore
runs exclusively, stores a complete pre-restore log in `recovery_archives`, replaces
the active log, and updates the projection in one transaction. Failure rolls back
all three. There is no automatic merge with current edits or other devices.
Settings → Restore pre-restore copy returns to the latest saved copy, preserving
another copy of the data it replaces. Copies survive reopening; repeated restores
retain older copies too, although the UI exposes only the latest. A retention and
permanent-removal policy must be designed before release.

Import/export is bounded to 20 MB and 100,000 events; oversized files
are rejected before replacing data. Native logging itself has no event-count cap.
Revisit the backup container/streaming limits before very large histories, and
measure native replay/write latency as daily records accumulate. Cache files from
export/import are removed when the action completes. Exporting or cancelling the
share sheet is not proof that the user saved an external copy.

## Browser preview

Platform-specific `native.web.ts`/`browserRepository.ts` keep the existing web
layout preview usable without Expo SQLite's WASM/server-header setup. The preview
uses a separate localStorage document and the same event/replay/queue logic; native
iOS uses SQLite. Browser quota/private mode, multiple tabs, downloads, and file
picker behaviour differ. Browser success is not native persistence evidence.

## Verification and remaining scope

`npm test` runs real SQLite migration/transaction/reopen tests through Node's
SQLite binding, replay and malformed-import tests, rapid-write/failure/retry tests,
and export round-trips. Tests inject failure between event and projection writes,
during initialization, and during restore. These exercise the production SQL and
domain modules; they do not substitute for Expo's native bridge or iOS force-quit
and Files/share-sheet testing. Follow [TESTING.md](TESTING.md) for that phone pass.

Comments, permanent erasure, scheduled-day semantics, richer statistics,
snapshots for launch optimization, encryption, and sync remain later work. An
incremental log alone is not a sync protocol.

References: [Expo SDK 57 SQLite](https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/),
[Sharing](https://docs.expo.dev/versions/v57.0.0/sdk/sharing/), and
[DocumentPicker](https://docs.expo.dev/versions/v57.0.0/sdk/document-picker/).
