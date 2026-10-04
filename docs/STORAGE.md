# Incremental local storage

Implemented 4 October 2026. The founder confirmed incremental storage, change-based
export, and undo, and accepted the top-bar UI before this work. The implementation
choices below are technical decisions; scheduling, comments, deletion, and cloud
sync remain separate product decisions. Persistence was confirmed on the physical iPhone; an older-undo report and native
backup/share-sheet acceptance remain under evaluation.

## What is saved

Checkbox entries, numeric daily totals, applied habit colours, and the haptic
preference now survive a reload. The existing 12 sample habits are initialized
once, not on every launch. Habit creation, renaming, ordering, archival, comments,
and statistics are not implemented by this milestone.

`src/storage/model.ts` defines version-1 events and deterministic replay.
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
versions. Future event reducers must continue to interpret existing v1 events.
Do not rewrite old events just to match a newer domain model. Keep tests for old
exports and migration fixtures. Version 1 is the first schema, so there is no
migration from an earlier persisted OnPurpose version.

## Event structure and semantics

Every event carries:

| Field              | Meaning                                                                   |
| ------------------ | ------------------------------------------------------------------------- |
| `version`          | Event schema version, currently `1`                                       |
| `id`               | Stable UUID generated once, retained on save retry                        |
| `sequence`         | Contiguous order starting at `1`; authoritative even if the clock changes |
| `recordedAt`       | UTC edit instant in ISO form with milliseconds                            |
| `timeZone`         | Device time-zone name at edit time, or `unknown` if unavailable           |
| `utcOffsetMinutes` | Local offset east of UTC at edit time                                     |
| `type`             | `initialize`, `change`, `undo`, or `redo`                                 |

`initialize` records the ordered habit definitions and starts with no entries and
haptics enabled. Each subsequent change targets one daily entry, one habit colour,
or the haptic setting, and includes `before` and `after` values.

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

History is now a virtualized list of actual changes, newest first, with explicit
effective dates for entries and edit times. It reveals older records in batches of 100. Initialization is not shown as a user edit. Colour/preference changes appear
alongside entry changes. It is a change browser, not yet a historical whole-screen
snapshot/reconstruction interface.

Undo reverses the latest active action and appends an `undo` event referencing it.
Redo reverses the latest undo and appends a `redo` event. Both validate the exact
inverse and current before-value. The stacks are reconstructed from events and
survive reopening/export/restore. A new ordinary edit clears the redo branch
without deleting its prior events. One accepted cell tap, number save, applied
colour, or preference toggle is one undo step. Arbitrary selective undo, gesture
batching, comments, and permanent erasure require later rules.

Undo is not permanent erasure. Version 1 has no deletion or erasure UI. Decide
privacy/erasure rules before implementing comments; do not assume append-only
history makes erasure impossible or unwanted.

## Portable backup version 1

Settings → Export backup opens the iOS share sheet; save the JSON to Files or
another destination. The app first waits for pending saves and captures a stable
log. The export is a readable JSON container of **changes**, not a replacement
snapshot of habit/day values. See [the synthetic example](examples/storage-v1.json).

The container has `format: "onpurpose.changes"`, `version: 1`, `exportedAt`,
`eventCount`, `sha256`, and `events`. The digest is SHA-256 of UTF-8
`JSON.stringify(events)` with its existing property order. It detects accidental
modification/incompleteness; it is not an authenticated signature. Exports are not
encrypted and may reveal habit names, dated values, colours, and preference/edit
metadata. Pre-restore copies are not bundled into the active export.

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

Version-1 import/export is bounded to 20 MB and 100,000 events; oversized files
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

Habit management, comments, permanent erasure, scheduled-day semantics, statistics,
snapshots for launch optimization, encryption, and sync remain later work. An
incremental log alone is not a sync protocol.

References: [Expo SDK 57 SQLite](https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/),
[Sharing](https://docs.expo.dev/versions/v57.0.0/sdk/sharing/), and
[DocumentPicker](https://docs.expo.dev/versions/v57.0.0/sdk/document-picker/).
