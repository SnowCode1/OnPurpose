# Incremental local storage

Implemented 4 October 2026. The founder confirmed incremental storage, change-based
export, and undo, and accepted the top-bar UI before this work. The implementation
choices below are technical decisions; comments, permanent erasure, and cloud
sync remain separate product decisions. Persistence was confirmed on the physical iPhone; an older-undo report and native
backup/share-sheet acceptance remain under evaluation.

## What is saved

Checkbox entries, numeric daily totals, multi-select categorical records,
free-text daily values, applied habit colours, and the haptic
preference now survive a reload. The existing 12 sample habits are initialized
once, not on every launch. Habit creation, renaming, units, icons, start dates, descriptions, ordering, archival, and undoable deletion now persist as well. Row/column spacing, app-wide text size, week start and date fading are saved global preferences.
Effective-dated success goals and weekday schedules also persist.
Full-screen statistics are derived from saved values; comments remain later work. See [HABIT_MANAGEMENT.md](HABIT_MANAGEMENT.md).

`src/storage/model.ts` defines version-17 events and deterministic replay, with
backward-compatible interpretation of existing version-1–16 records. The version
sections below describe when each field was introduced; new writes use v17.
`repository.ts` implements the native database operations against a small SQL
interface; `native.ts` connects it to Expo SQLite and native UUID/SHA-256 support.
`store.ts` owns loading, immediate UI state, the serialized write queue, undo,
redo, and exclusive backup work. React subscribes through `usePersistentStore.ts`.

Grid cells use `selection.ts` to subscribe to their individual primitive or stable array value;
date headings select whether their date has any active-habit entry. Unchanged
selections ignore save acknowledgements and unrelated edits. This is derived
notification filtering, not another persisted/cache projection. Store timing can
be enabled in development; event/replay, serialized writes and schema are unchanged.
See [PERFORMANCE.md](PERFORMANCE.md).

Habit/day records answer “What did I record for Tuesday?” Change records answer
“What changed, and in what order?” Correcting Tuesday on Wednesday uses Tuesday's
explicit `YYYY-MM-DD` key and Wednesday's edit timestamp. They are never conflated.

## Requested preset icon update

After a successful app opening, `presetIcons.ts` recognizes the original complete
12-habit preset seed and adds missing preset icons via `ChangeStore.change`.
These are normal v4 habit edits in the existing serialized queue, with History,
Undo/Redo, visible failure/retry, and backup support. They do not alter initialization
or reset/reseed the store. Current choices, names changed from the preset, unrelated
seeds, and any habit with a past icon assignment/removal are skipped. Raw history
prevents reapplication after Undo and reload. Fresh initialization already includes
icons; no follow-up edits are necessary. Restore remains exact at the time it runs;
an older preset archive without icon history can receive this update on next launch.

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
versions. Future event reducers must continue to interpret existing v1/v2/v3/v4 events.
Do not rewrite old events just to match a newer domain model. Keep tests for old
exports and migration fixtures. Version 1 is the first schema, so there is no
migration from an earlier persisted OnPurpose version.

## Event structure and semantics

Every event carries:

| Field              | Meaning                                                                          |
| ------------------ | -------------------------------------------------------------------------------- |
| `version`          | Event schema version, currently `17`; existing `1`–`16` records remain supported |
| `id`               | Stable UUID generated once, retained on save retry                               |
| `sequence`         | Contiguous order starting at `1`; authoritative even if the clock changes        |
| `recordedAt`       | UTC edit instant in ISO form with milliseconds                                   |
| `timeZone`         | Device time-zone name at edit time, or `unknown` if unavailable                  |
| `utcOffsetMinutes` | Local offset east of UTC at edit time                                            |
| `type`             | `initialize`, `change`, `undo`, `redo`, or `preference`                          |

`initialize` records the ordered habit definitions and starts with no entries and
haptics enabled. Each subsequent edit includes `before` and `after` values.
Version-2 `change` events target an entry or habit colour and include a `groupId`.
A new group's ID is its first event's ID; corrections retain that ID. Version-2
`preference` events persist global settings (haptics, and row spacing since v5) in the same log
and export, outside habit History and Undo/Redo. Undo targets an active group ID;
Redo targets its latest undo event ID and restores the original action.

Existing version-1 logs retain their original interpretation, including historical
preference undo/redo and abandoned redo branches. Their habit edits remain
individual undo steps, with settings and undo/redo rows filtered from the view.
New events use version 17. A log can progress from versions 1 through 17, skipping
versions if needed, but never downgrade. New habit-definition changes record
`habitId`, `index`, and `before`/`after` definitions (null for creation/removal).
Order changes record exact before/after ID arrays. Definitions may include an
explicit checkbox/number/categorical/text `type` and an `archived` boolean; legacy numeric habits
remain inferred from their units. Archive preserves entries. Undoing creation
cannot remove a habit while it still has entries, and type conversion is rejected
while values exist. Definition equality ignores JSON field ordering.

Version 4 adds an optional flat `icon` string to habit definitions:
`phosphor:<stable-catalogue-id>`, `tabler:<stable-catalogue-id>`, or
`emoji:<single-emoji-sequence>`. No icon means
an absent field, not null. Icons are validated against the bundled stable catalogue
or the pinned emoji validator. Unknown packs/IDs, URLs, objects, plain text, and
multiple emoji are rejected. Version-1/2/3 definitions still reject this field.
Icons use the existing atomic before/after habit edit, including Undo/Redo and
archive restore. Emoji validation dependency versions affect replay compatibility;
retain accepted sequences and catalogue IDs when updating them. Tabler extends
the v4 catalogue without changing event shape or SQL schema. Earlier builds
reject unrecognized Tabler IDs rather than silently dropping them.

Version 5 adds an optional `startDate` (`YYYY-MM-DD`) to definitions and a
`rowSpacing` preference with `compact`, `standard`, or `roomy` before/after values.
Newly created habits and fresh preset seeds explicitly store the local current date.
Existing definitions remain unchanged: the editor/statistics infer a default from
creation or the earliest past record. Applying a different date writes one ordinary,
undoable definition change. Unchanged legacy date drafts add no field/event.
Statistics use an explicit start as their lower bound, preserving all older values;
see STATISTICS.md. These calculation semantics are an implementation choice for
founder review, not a deletion/migration rule.

Absent row spacing means Standard, preserving legacy projection JSON. New spacing
preferences validate their before-value against that effective default, persist in
the same atomic queue, and leave History, Undo/Redo and correction groups intact.
Versions 1–4 reject these new fields/change types. A v5 log cannot downgrade. Old
fixtures remain unchanged; the v5 fixture extends the original v4 prefix with a
date edit, Undo, spacing preference, and Redo. No SQL schema change or reset occurs.

Version 6 adds `columnSpacing` (compact/standard/roomy), `weekStart`
(monday/sunday), and `dateFading` (boolean) preference changes. Defaults are compact,
monday and true; absent projection fields resolve to these defaults. Preferences
validate before-values against effective defaults and retain all habit groups and
Undo/Redo. Versions 1–5 reject the new change types, and v6 logs cannot downgrade.
No existing events, entries, dates or projections need migration. SQL schema stays
at version 1. SETTINGS.md documents the controls and their rendering-only effects.

Version 7 adds an optional nonempty `description` string to habit definitions,
limited to 20,000 UTF-16 characters. Blank editor text removes the field; null,
empty, oversized and non-string fields are rejected. Versions 1–6 reject it.
Descriptions use ordinary before/after habit changes, with atomic writes,
Undo/Redo, archive/restore and full export. Logs cannot downgrade after v7.
The documented v7 fixture extends the unchanged v6 prefix with a Markdown edit.
SQL schema stays at version 1; previous logs are never rewritten or reseeded.

Version 8 adds `textScale`, a global preference from 0.85 to 1.50 in 0.05
steps, defaulting to 1 when absent. It validates effective before-values, persists
through the ordinary atomic queue, and is excluded from History/Undo. It preserves
Redo and does not close habit correction groups. Versions 1–7 reject this field;
logs cannot downgrade after v8. The v8 fixture extends the unchanged v7 prefix.
The SQL schema remains version 1 and older records are never rewritten.

Version 9 adds `hideCompleted`, a strict boolean global preference. Missing
fields resolve to false, preserving existing row visibility. It persists as a
`preference` event outside History/Undo, preserving Redo and entry groups.
Versions 1–8 reject this change; logs cannot downgrade after v9. The v9 synthetic
fixture extends the exact unchanged v8 prefix. The completion predicate is
separate from storage: checkbox checks qualify now; numeric conditions are
founder-deferred. SQL schema remains version 1, with no rewritten events.

Version 10 adds explicit `categorical` and `text` habit types and mixed daily
values. Categories are a bounded list (1–40) of stable `id`, `label` (up to 60
characters), optional `shortLabel` (up to 12) and optional `archived` fields. At
least one option stays active. Entries are nonempty sorted unique ID arrays;
several options can be selected on one day. References must belong to that
habit. Archiving/renaming an option preserves its ID and selections; referenced
options cannot be removed from the definition. Text values are nonblank plain
strings, up to 10,000 UTF-16 characters; meaningful whitespace/newlines are
preserved. Empty selections or blank text clear to null. Units belong only to
numeric habits. Versions 1–9 reject new types/fields/value shapes. Logs cannot
downgrade after v10. SQL stays at schema 1, with no reseeding or rewritten events.

Array preconditions, group continuity, net-zero suppression and Undo/Redo
inverses compare content, including after JSON/SQLite round trips. Unchanged
entry arrays keep their references for per-cell subscriptions. Categorical/text
edits use the same serialized atomic queue and correction window. Habit type
changes with any entries remain forbidden, comparing all four effective types.
The v10 fixture extends the exact unchanged v9 prefix with both definitions,
multi-selection, multiline text correction, Undo and Redo.

Recoverable description drafts are separate from applied habit state. A separate
native draft database/browser key keeps unfinished text outside the canonical log,
History and backups; sample drafts remain memory-only. Local v2 draft JSON adds
optional bounded selection/scroll positions; v1 records remain readable. Clean,
text-matched bookmarks use separate keys in that same store. Main SQL schema,
v7 log/export and canonical Undo/Redo remain unchanged. Draft failures do not reset
any database. See [DESCRIPTIONS.md](DESCRIPTIONS.md) for recovery/Done semantics and
the one-time, undoable placeholder-note update requested by the founder.

Habit-definition and ordering edits are distinct actions and close correction
groups. Reordering validates exact current order and a unique complete permutation;
archived positions remain present. No old events are rewritten, and no database
reset or SQL schema change is required. Older builds must reject v4 data rather
than discard unfamiliar events.

Daily entries use stable habit IDs and explicit calendar dates. New text/category
values follow the v10 rules above; existing numeric semantics remain unchanged. Numeric zero is a
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

Undo is not permanent erasure. Settings → Archived habits offers confirmed,
undoable deletion. It removes the current definition and daily records together;
raw edits, earlier notes/values, recoverable local description drafts/bookmarks,
backups and pre-restore copies remain. Permanent erasure still needs its own
privacy/retention rules.

## Portable backup version 17

Settings → Backups → Export backup opens the iOS share sheet; save the JSON to Files or
another destination. The app first waits for pending saves and captures a stable
log. The export is a readable JSON container of **changes**, not a replacement
snapshot of habit/day values. See [the version-12 deletion example](examples/storage-v12.json),
[the version-11 goal timeline example](examples/storage-v11.json),
[the version-10 synthetic example](examples/storage-v10.json),
[the version-9 synthetic example](examples/storage-v9.json),
[the version-8 synthetic example](examples/storage-v8.json),
[the version-7 synthetic example](examples/storage-v7.json),
[the version-6 synthetic example](examples/storage-v6.json),
[the version-5 synthetic example](examples/storage-v5.json),
[the version-4 synthetic example](examples/storage-v4.json),
[the version-3 example](examples/storage-v3.json),
[version-2 fixture](examples/storage-v2.json), and
[the unchanged version-1 fixture](examples/storage-v1.json).

The container has `format: "onpurpose.changes"`, `version: 13`, `exportedAt`,
`eventCount`, `sha256`, and `events`. The digest is SHA-256 of UTF-8
`JSON.stringify(events)` with its existing property order. It detects accidental
modification/incompleteness; it is not an authenticated signature. Exports are not
encrypted and may reveal habit names, descriptions, dated values, colours, and preference/edit
metadata. Pre-restore copies are not bundled into the active export. The exporter
always writes container version 13. The importer accepts versions 1–13;
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
Settings → Backups → Restore previous data returns to the latest saved copy, preserving
another copy of the data it replaces. Copies survive reopening; repeated restores
retain older copies too, although the UI exposes only the latest. A retention and
permanent-removal policy must be designed before release.

Import/export is bounded to 20 MB and 100,000 events; oversized files
are rejected before replacing data. Native logging itself has no event-count cap.
Revisit the backup container/streaming limits before very large histories, and
measure native replay/write latency as daily records accumulate. Cache files from
export/import are removed when the action completes. Exporting or cancelling the
share sheet is not proof that the user saved an external copy.

## Development sample store

For statistics review, development builds can temporarily select a separate
in-memory ChangeStore populated with 180 days of synthetic v4 events. It receives
neither real values nor a native/browser repository and cannot replace/restore
backups. Its writes and Undo/Redo use the normal event logic but never reach SQLite,
localStorage, exports, or real History. Returning to real data restores the original
store; resetting/reloading discards only the sample. No persistence format changes.

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

Comments, permanent erasure, rolling quotas, richer statistics,
snapshots for launch optimization, encryption, and sync remain later work. An
incremental log alone is not a sync protocol.

References: [Expo SDK 57 SQLite](https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/),
[Sharing](https://docs.expo.dev/versions/v57.0.0/sdk/sharing/), and
[DocumentPicker](https://docs.expo.dev/versions/v57.0.0/sdk/document-picker/).

## Version 11: effective-dated success goals

Optional `Habit.goals` stores stable IDs, unique sorted effective dates, typed
conditions and nonempty weekday sets. Goal/schedule changes use ordinary undoable
definition edits; changing Today never rewrites earlier goals or daily entries.
Earlier version edits/removal are explicit, confirmed and reversible.
Strict validation rejects malformed rules, unknown category IDs and date collisions.
No default goals are written to existing stores. Goals were introduced in v11;
current writes/exports use v12 alongside archived-habit deletion, retaining
unchanged v1–v11 prefixes. SQL remains schema 1. See [GOALS.md](GOALS.md)
and the exact-prefix [v11 fixture](examples/storage-v11.json).

## Version 12: undoable archived-habit deletion

The founder chose Delete with Undo. `deleteHabit` is a distinct structural change
with a stable habit ID, exact current index, and a before-snapshot containing the
complete archived definition plus date-keyed entries; after is null. Undo swaps
before/after and restores every entry and the retained archived position in one
atomic transaction. Redo removes them again. Empty habits and deleting the last
habit are supported without reseeding. Definitions include notes, icons, categories
and effective-dated goals unchanged.

Validation requires an archived definition, matching ID/index, valid dates and
values, and the exact complete current entry set. Versions 1–11 reject deletion;
logs cannot downgrade after v12. Ordinary habit removal keeps its prior restriction
against removing habits with entries. Deletion closes correction groups, uses the
normal serialized queue/failure/retry path, and never rewrites existing events.
SQL remains schema 1. The [v12 fixture](examples/storage-v12.json) extends the exact
v11 prefix with archive, delete, Undo and Redo.

History shows one named deletion action. `historyDisplayState` supplies missing
habit definitions from active deletion snapshots solely for older action labels;
these definitions/entries do not return to the grid/archive/statistics. Description
comparisons remain readable but note-only restore requires a currently stored
habit. Undo deletion first to restore an old description. Local draft/bookmark
storage is retained for that recovery and remains outside backups as before.

## Version 13: fixed periods and repeating on/off cycles

Goal versions may include `period` (unit week/days, days, anchor, operator,
target, optional upper) and `cycle` (unit days/weeks, on, off, anchor). Shapes,
integer bounds and dates are strictly validated. Periods require an active daily
condition and all seven weekdays; cycles can narrow applicable dates. Older
v1–v12 definitions reject these fields. Current event/backup writers use v13;
imports retain v1–v12 and logs cannot downgrade after v13. SQL stays at schema 1.

Ordinary definition snapshots preserve period/cycle anchors through edits,
Undo/Redo, archiving/deletion and backup recovery. Preferences never retroactively
realign saved weeks. [The v13 example](examples/storage-v13.json) extends the exact
unchanged v12 prefix. No existing store is reseeded or assigned inferred goals.

## Version 14: dated checkbox defaults and unchecked success

Current event/export writers use v14; unchanged v1–v13 prefixes remain readable.
Goals allow `rule: {kind: 'unchecked'}` and optional boolean `defaultChecked`
(checkbox habits only). Absent means Off. Checkbox entry 0 explicitly means Off,
1 means On, and null removes an override to inherit the dated default. V1–v13
reject the new condition, default field and checkbox zero. SQL stays schema 1;
no migrations, reseeding or bulk synthetic entries occur.

Defaults are saved in ordinary dated habit definitions so Undo/Redo, archive
restore/deletion snapshots and atomic backup recovery preserve them. Toggling
away from and back to the default uses normal net-zero grouping. Preferences
remain outside History. The [v14 fixture](examples/storage-v14.json) extends the
exact v13 prefix. Its future default does not alter earlier records.

## Version 15: checkbox appearance preference

`checkboxStyle` accepts exactly `boxes` or `marks`. Absent fields use `boxes`.
It is a global preference and remains outside visible History and Undo/Redo;
it preserves Redo and does not interrupt entry correction groups. Current writers
and exports use v15. V1–v14 reject this preference and remain readable with their
exact prefixes; SQL stays schema 1. There is no seed update or entry rewrite.
The [v15 example](examples/storage-v15.json) extends the v14 log with this setting.

## Version 16: optional grid dividers and tap feedback

`weekDividers` and `tapAnimations` are strict boolean preferences, both defaulting
to true when absent. They stay outside History/Undo, preserve Redo and correction
groups, and use the ordinary serialized write/retry and atomic restore paths.
Current writers/exports use v16; v1–v15 prefixes and schema 1 remain unchanged.
Older event versions reject these new preference kinds. The [v16 example](examples/storage-v16.json)
extends the exact v15 prefix with both switches turned off.

## Version 17: name width and revised column spacing

Current writers/exports use v17, accepting unchanged v1–v16 prefixes and SQL
schema 1. `nameColumnWidth` validates narrow/standard/wide, default Standard.
`columnDensity` validates compact/standard/roomy for the revised 44/48/64-point
choices. It falls back through `effectiveColumnSpacing`: old absent/Compact to
Standard, old Standard/Roomy to Roomy. Old `columnSpacing` events still validate
with their original absent Compact precondition and retain their raw values.
No existing event or habit is rewritten or reseeded. Versions 1–16 reject the
new kinds, and older events cannot follow v17 events.

Both preferences use the ordinary serialized atomic write/restore path, preserve
Redo and grouping, and remain outside habit History/Undo. The [v17 example](examples/storage-v17.json)
extends the exact v16 prefix. The temporary grid Undo is a normal guarded
compensating entry change, preserving append-only history and visible failure/retry.
Its receipt and timers are ephemeral and excluded from exports.
