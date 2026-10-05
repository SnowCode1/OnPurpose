# Habit descriptions

Date: 5 October 2026. Status: requested by the founder and implemented;
phone layout, keyboard and recovery acceptance are pending.

## Reading and editing

A habit can have an optional description containing plain text or Markdown.
Its purpose is to keep motivation, reminders and links one habit-name tap away.
The description appears before the charts in full-screen statistics. Long notes
show a bounded preview and Read more/Show less, so a note does not force a long
scroll to reach the statistics. Empty descriptions show one small Add description
action, with no empty card or instructional block.

Creation and Edit have one compact Description control, showing a two-line text
summary or an optional-note hint. It opens a full-screen editor with fixed Close
and Done controls, Write/Preview tabs and bold/list/link insertion shortcuts.
The toolbar wraps if text scaling or available width requires it. Writing has
most of the screen; the keyboard does not push Done into scrollable content.

Done from a creation/edit dialog updates that dialog's draft. The habit is only
saved when the outer Done is used; outer Close discards it. Done from statistics
applies one normal undoable habit edit immediately. Close asks before discarding
changed text. Blank/whitespace-only text removes the optional field. Newline
normalization preserves indentation and other meaningful Markdown whitespace.
Notes are limited to 20,000 UTF-16 characters; the counter appears near the limit.
These preview/size choices are implementation decisions, not new product goals.

## Markdown and links

`markdown-it` 15.0.2's browser build parses text into tokens; `DescriptionText.tsx`
renders native text/views. Supported content includes headings, bold/italic,
strikethrough, paragraphs, lists, quotes and code. Plain URLs become links.
Raw HTML is displayed as text. Tables are not enabled. Image syntax displays its
alt text, without fetching remote images when a note is opened.

Links open through the operating system only on an intentional tap. Explicit
HTTPS/HTTP, mailto and app note links (such as obsidian) are supported; relative
URLs, malformed addresses and executable/local-resource schemes are rejected.
If the target app cannot open a link, the user sees an error. Link text is
underlined and uses the habit colour when readable, with a contrast fallback.
Markdown itself requires no account, network connection or external editor.

The parser is MIT licensed; retain [its notice](licenses/MARKDOWN_IT_LICENSE.txt).
Upstream: [markdown-it](https://github.com/markdown-it/markdown-it).

## History and durable storage

Descriptions are an optional `description` string on v7 habit definitions.
Before/after definitions use the existing atomic event/projection transaction,
serialized writes and visible failure/retry. Creation, ordinary editing, clearing,
Undo/Redo, archive/restore and full backups retain descriptions. Statistics read
the applied description; unfinished text never changes the grid or statistics.
See [STORAGE.md](STORAGE.md).

A description change has a compact Description edited/cleared History row.
Tap it to compare Before and After in a full-screen reader. Restore copies just
the selected description onto the current habit, preserving its current name,
colour, icon, entries and archive status, as a new undoable edit. Restoring an
empty version clears the description. A version already applied cannot be
restored redundantly. Visible History continues to contain active actions only;
Undo removes rows and Redo restores them, while the raw log remains complete.

## Interrupted drafts

The editor saves local draft text after 350 milliseconds of inactivity and on
backgrounding/unmount, through a serialized queue. Native drafts live in a separate
`onpurpose-description-drafts.db` with schema version 1; browser drafts have a
separate localStorage prefix. These are recoverable writing drafts, outside
History/Undo and full backups. Applied notes remain in the main change log.

Reopening recovers an unsaved draft when its saved-description base still matches.
If the saved note changed meanwhile (including through Undo or backup restore),
a native alert lets the user keep the current saved version or recover the older
draft. Applied/discarded drafts are cleared in queue order, so an earlier write
cannot resurrect them. Draft errors are visible in the editor and do not prevent
Done from using the main store's normal durability/retry path. An abrupt kill
before a debounce/background write completes can lose the most recent keystrokes.

Creation uses one recoverable new-habit description slot; it does not recover the
whole name/icon/colour form. Sample-mode notes and drafts stay entirely in memory
and disappear on full reload. They cannot write to real drafts or real habit data.

## Requested placeholder notes

Each preset has a short fictional Markdown note and a clearly illustrative
`example.com` link. The development statistics sample includes these notes.
Fresh real-store initialization includes them once.

For a pre-description store, `storage/presetDescriptions.ts` adds placeholders
through normal undoable edits to existing habits, including custom and archived
habits. Custom habits receive a generic note rather than an invented motivation.
Existing descriptions and any past assignment/removal/Undo are preserved. Raw
history prevents repeating the update after Undo or reload. New v7 custom habits
start with an optional empty description and receive no automatic placeholder.
No store is reset or reseeded. Older backups may receive the one-time update on
next opening; a restore itself still reproduces the validated archive exactly.
