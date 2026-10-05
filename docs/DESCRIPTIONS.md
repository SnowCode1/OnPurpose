# Habit descriptions

Date: 5 October 2026. Status: requested by the founder and implemented;
the founder confirmed improved formatting selection and bottom-link-sheet spacing
on the iPhone on 5 October 2026. Broader keyboard, accessibility and recovery
acceptance remains pending.

## Reading and editing

A habit can have an optional description containing plain text or Markdown.
Its purpose is to keep motivation, reminders and links one habit-name tap away.
The description appears before the charts in full-screen statistics, inside a
compact rounded card requested by the founder to distinguish notes from statistics.
The dark surface, subtle outline and inset text define the note's boundary;
Edit, Versions and Read more stay within it. The collapsed fade matches the card surface.
Long notes
show up to four complete blocks in a 220-point preview (scaled with system text),
with Read more/Show less when more content remains or the measured height exceeds
that limit. This expands the earlier two-block/150-point preview at the founder's
request. Character count alone does not trigger Read more. A note still does not
force a long scroll to reach the statistics. Empty descriptions show one small Add description
action, with no empty card or instructional block.

Creation and Edit have one compact Description control, showing a two-line text
summary or an optional-note hint. It opens a full-screen editor with fixed Close
and Done controls. The founder requested live formatted editing, replacing
Write/Preview tabs. Bold and italic toggle the selected formatting rather than
nesting Markdown markers. One compact toolbar provides local Undo/Redo, Bold,
Italic, text/list options, links and highlight colours. Text options group headings,
lists, quotes, strikethrough, inline code and Clear formatting in a compact panel.
Links can be added, changed or removed while retaining the selected text. Highlight
options are None, Yellow, Green, Blue, Purple and Pink; choosing the same colour
again removes it. Additional controls appear only when opened. The toolbar wraps
if text scaling or available width requires it. The toolbar stays at the bottom
of the editor, immediately above the keyboard while typing; native Close/Done
stay at the top. Writing has most of the screen. Text and highlight menus float
above the toolbar without changing the writing area's size or scroll position.
They fit the remaining editor height after keyboard/orientation/text-size changes
and scroll when necessary. A 140 ms opening transition respects Reduce Motion.
Tap the menu button again, tap the document or use Escape to dismiss a menu.
The Highlight button has a small colour indicator reflecting the whole selected
range. Plain text shows a neutral indicator; mixed colours or highlighted/plain
text show a mixed indicator with an accessible mixed-selection label. The palette
marks a colour selected only for a uniform selection.

Putting the caret/selection in a single link opens a compact inspector above the
formatting strip, showing its destination and Open/Edit/Remove/Close. Tapping a
link while editing places the caret and inspects it; it never follows the link.
Open deliberately hands the validated destination to the native link handler;
reader and editor share the same failed-open message. Edit selects the complete
link, including differently formatted words, for the existing link sheet. Remove
keeps the words and other formatting and supports local Undo/Redo. Close keeps
the caret and remains dismissed until leaving/re-entering that link. Inspectors
do not compete with open text, colour or link-entry menus.

Link entry uses a compact bottom sheet within the editor, above the keyboard.
Its address field receives focus and its Cancel/Apply/Remove actions have a separate
padded footer that stays visible while fields scroll if space is tight. Cancel,
tapping outside or Escape return to the original text selection. New links remain
selected after Apply. Touch/pointer taps on formatting tools do not take focus
from the editor. Readiness and initial focus happen once per editor instance;
Expo DOM callback-proxy replacements during native updates must not refocus at
the end of the document. `richText/useEditorReady.ts` owns this boundary.

Select words and paste a full web or app URL to turn the words into a link,
retaining their other formatting and selection. Pasting onto an existing linked
phrase changes its destination. This is one local Undo/Redo step, separate from
adjacent typing. It works through the normal paste event, with no background
clipboard reading. The explicit link sheet remains available. Ordinary text,
bare domains, empty cursors, code and multi-block selections follow the normal
paste path. Executable/local-resource URLs are not made into links. Oversized
link formatting is rejected by the same atomic description limit.

The editor has its own temporary Undo/Redo history, separate from app History.
Typing groups after 500 ms of inactivity; toolbar formatting actions are separate
steps. Editing after Undo clears the editor's Redo branch. This session history
holds at most 100 steps and is not recovered with a draft or exported. Done still
applies one normal habit change. Opening and closing without edits, or undoing
back to the initial document, retains the original Markdown bytes.

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
strikethrough, paragraphs, lists, quotes, code and optional highlights.
Yellow highlights use `==text==`; other named colours use `=={green}text==`
(with blue, purple and pink also supported). This is a small OnPurpose Markdown
extension with a fixed palette, not arbitrary HTML or styles. Native readers,
History comparisons and the editor use the same syntax. Other Markdown apps may
show the highlight delimiters literally. Plain URLs become links.
Raw HTML is displayed as text. Tables are not enabled. Image syntax displays its
alt text, without fetching remote images when a note is opened.

Links open through the operating system only on an intentional tap. Explicit
HTTPS/HTTP, mailto and app note links (such as obsidian) are supported; relative
URLs, malformed addresses and executable/local-resource schemes are rejected.
If the target app cannot open a link, the user sees an error. Link text is
underlined and uses the habit colour when readable, with a contrast fallback.
Markdown itself requires no account, network connection or external editor.

The live editor uses Tiptap/ProseMirror in a local Expo DOM component. Only the
full-screen writing surface uses this embedded web editor; the grid, statistics,
notes reader and saved data remain native. Expo SDK 57 includes its DOM WebView in
Expo Go. `@expo/metro-runtime` supports the embedded bundle. JavaScript, CSS and
HTML are bundled with the app; no CDN, server or account is required. The safe
reader parser feeds a limited editor schema; HTML stays literal, and image metadata
is retained with an alt-text placeholder rather than a fetched image. Done/Close
request a current document snapshot across the DOM bridge before applying or
confirming a discard, so the last keystroke need not wait for draft autosave.
Serialized formatting also counts toward the 20,000-character limit; an oversized
paste is rejected as a whole, with existing text and Undo retained.

`richText/selectionLinkPaste.ts` owns the selected-text paste shortcut;
`richText/useFloatingMenuSpace.ts` sizes overlay menus locally without sending
per-frame layout through the native bridge. No storage schema changes are needed.

The editor's MIT notices are retained in
[TIPTAP_LICENSE.txt](licenses/TIPTAP_LICENSE.txt),
[PROSEMIRROR_LICENSES.txt](licenses/PROSEMIRROR_LICENSES.txt) and
[MARKED_LICENSE.txt](licenses/MARKED_LICENSE.txt).
References: [Expo DOM components](https://docs.expo.dev/guides/dom-components/),
[Tiptap Markdown](https://tiptap.dev/docs/editor/markdown/getting-started/basic-usage).

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

Versions beside Edit/Add opens a compact, virtualized list of this habit's active
description changes, newest by sequence first. It uses the same Before/After
reader and Restore path as History. Rows include saved time and a short text
summary; only the latest matching applied version is marked Current. Repeated
text is retained because different Before versions may contain recoverable notes.
Cleared notes retain Versions even without a note card. The control is absent
until a description action exists. Initial/seed text is available as Before the
first edit; this is not a second snapshot store. Undo/Redo affect the rows exactly
as in History, with all raw events retained in export. Access from the statistics
card also keeps restoring separate from unfinished creation/edit-form drafts.

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
