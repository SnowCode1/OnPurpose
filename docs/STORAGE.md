# Incremental storage and history

## Confirmed direction

The founder wants the app's storage and export format to represent incremental
updates. A separate history feature should use that same information. This is
not simply saving a separate daily checklist, and is not a cloud-sync requirement.

Habit/day records describe what happened on a calendar day. Change records describe
how the stored app state evolved. They must remain distinct: editing Monday's
value on Wednesday records Monday as the effective habit date and Wednesday as
when the edit was made.

## Proposed implementation to evaluate

Use a versioned append-only change log in a local SQLite database, with derived
query tables for the current habits, dated values, and comments. This pattern is
often called event sourcing: the log preserves changes, and normal screens read
an efficient current-state view. SQLite and this exact layout are proposals;
no persistent store has been implemented yet.

A log entry would carry a stable event ID, sequence, schema version, recorded
instant, action type, entity IDs, and the action payload. Dated habit actions also
carry the intended local calendar date. Avoid deriving that date from UTC alone.

Candidate actions include habit creation/rename/type configuration, deliberate
reordering, archival, setting/clearing a daily value, and adding/editing/removing
a comment. Values need to distinguish unrecorded from an explicit zero. Comment
attachment and hard deletion rules must be decided before the schema is final.

For example, recording 20 minutes for a day and later correcting it to 30 would
append two changes. The grid reads 30; the history can show the correction. A
numeric target and its evolution also affect historical statistics, so specify
whether statistics use historical or current target rules.

## Reliability requirements

- Commit a change and update its current-state view in the same transaction.
- Serialize rapid edits without dropping or reordering them.
- Define whether visual feedback is optimistic; never show unsaved data as durable
  when a write fails. Offer a comprehensible retry/recovery path.
- On import, validate versions, event IDs, references, values, and ordering before
  replacing data. Handle duplicates deterministically and preserve a backup.
- Replaying an exported history must reproduce the same meaningful app state.
- Use explicit schema migrations and tests; don't silently rewrite old events.
- Use stable habit IDs across renaming and archival so history remains meaningful.
- Separate recoverable undo from intentional permanent erasure. An append-only
  log should not accidentally make private comments impossible to remove forever.

## Export proposal, not a final format

A portable archive could contain a format/version manifest and newline-delimited
JSON change records, plus any future attachments. A readable daily CSV may later
be a useful secondary export, but would not replace the full-fidelity change log.

Design a small example export and demonstrate replay before committing to a
format. Choose what settings are historical and what is device-specific. Do not
log ephemeral UI actions such as scrolling or opening a screen by default.

## Next design decisions

Define event coverage, daily-value semantics, comment attachment, corrections,
undo/permanent erasure, date/time-zone policy, export integrity, restoration,
and migration rules. Build replay/round-trip and interrupted-write tests before
using this store for real habit data. Sync/merge across devices is a separate
future requirement; an event log alone does not solve it.
