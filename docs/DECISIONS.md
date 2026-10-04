# Decision log

## 029 — Reduce grid update work before changing persistence

Date: 4 October 2026. Status: founder authorised the proposed performance pass;
implemented, phone acceptance pending.

Use selected store subscriptions for individual cells and date-heading state,
stable root props, memoized date columns/statistics, precomputed colour levels,
and cached date objects/formatters. Save acknowledgements no longer invalidate
the full grid. Avoid duplicate extensions when header/body reach the same history
boundary. Preserve exact colours, interactions, native scroll synchronization,
and storage semantics. Add opt-in development timing without names/entry data.

Synthetic desktop benchmarks confirm cheaper colour/date preparation and scoped
notifications. They also show remaining long-history memory/projection work;
SQLite's JSON projection and the immutable reducer are unchanged. Native profiling
and a release-device comparison remain necessary before claiming smoothness or
choosing a database migration. See PERFORMANCE.md for evidence and limits.

## 028 — Statistics interaction and formatting polish

Date: 4 October 2026. Status: founder requested; implemented, phone review pending.

The founder reported no way to deselect chart bars and an unnecessary outline on
monthly day cells. Tap the selected period again to clear it; also provide a Clear
button and VoiceOver action. Remove the calendar's Today border. These are the
requested changes; the following supporting polish is an implementation choice.

Keep chart inspection in a reserved two-line area, separate the vertical zero/max
scale from date labels, and include years for ranges crossing a year boundary.
Store selection by date bounds to avoid silently selecting another bucket after
backdating changes All-time grouping. Range changes/local rollover reset it.
Use unambiguous weekday headings and numeric units. Numeric calendar backgrounds
retain intensity, while date text stays opaque with contrast calculated against
that background. No statistics calculations, entry semantics, or storage changes.

## 027 — Animated Today return and editable statistics calendar

Date: 4 October 2026. Status: founder requested; implemented, phone acceptance pending.

Today scrolls both date lists together on the UI thread, using a proposed 280 ms
ease-out. Keep the current range during the animation, then collapse future dates
at the same visible Today position. This supersedes decision 015's immediate
Today reset. A new horizontal drag cancels the animation; geometry changes and
unmount also cancel it. Respect system Reduce Motion and keep normal scrolling quiet.

Calendar days in statistics use the main grid's entry handler and daily-total
dialog. Checkbox taps immediately toggle; numeric taps edit the selected date,
including zero/clear/Cancel. Preserve normal persistence, grouping, haptics, retry,
and Undo/Redo without a new event type. Future days in the displayed month remain
editable, consistent with the founder's future-entry requirement; show their values
in the calendar while excluding them from statistics. Add a short tap hint and
full-date accessibility labels/checkbox states.

## 026 — Isolated sample history for statistics review

Date: 4 October 2026. Status: founder confirmed sample data and populated statistics
are showing on the iPhone. Detailed interaction checks remain.

Provide 180 days across all 12 presets using the real statistics calculations.
Implementation choice: an isolated development sample store rather than adding
fictional entries to the real append-only log. Include streaks/gaps, improving
and declining rates, weekday patterns, variable daily totals, decimal water values,
zeros, and unrecorded days. Never fabricate future entries.

Settings offers Sample data and Reset sample data. The toolbar's existing brand
space says SAMPLE DATA. Edits remain in memory, real entries stay separate, and
backups are unavailable in sample mode. A development env flag selects the startup
mode; it is enabled locally for this review and false in the example file. The
sample module is loaded behind **DEV** and removed from production bundles.

## 025 — Preset icons and removing grid renders from drag swaps

Date: 4 October 2026. Status: founder requested; implemented, phone acceptance pending.

The founder accepted the icons and asked to assign them to all current presets.
Give the 12 seed habits appropriate Phosphor/Tabler icons. After successful opening,
apply missing icons in existing recognized preset lists as ordinary v4 habit edits.
Preserve chosen/previously removed icons, renamed/custom habits, entries, order,
archive state, and the original seed. Raw icon history prevents reapplication after
Undo or removal. These safety rules are implementation choices; custom habit icons
remain optional. No projection rewrite, reseeding, or database migration.

The founder reports stutter only during fast row crossings. Source tracing found
setDraft triggered a full HabitGrid render at each swap, rebuilding cell controls
and their colours on the JavaScript thread that also handles touch movement.
Keep the temporary order in a ref and publish Y targets through shared values.
Each row reacts on the UI thread and retargets its spring only when needed; React
updates at drag start/end, not on each crossing. Preserve fixed layout anchors,
actual-row appearance, cancellation, haptics, edge scrolling, and drop-only writes.
This removes an identified source of swap work; native smoothness remains unmeasured.

## 024 — Tabler and a clearer, compact habit icon picker

Date: 4 October 2026. Status: founder requested; implemented, device acceptance pending.

The founder approved Tabler alongside Phosphor, asked for compact Icon/Colour
controls in the editor, an Icons default tab even when nothing is selected, and
clear full-catalogue search scope. Use two side-by-side appearance buttons with
symbol/swatch previews, wrapping for larger text. Remove the redundant full-width
icon-name and hex-value rows; detailed values remain in their respective pickers.

Bundle all 5,166 Tabler Outline designs from pinned @tabler/icons 3.48.0, with
MIT attribution and generated local paths/metadata. Use a 1.5/24 stroke to match
Phosphor Regular's approximate relative line weight. These are implementation
choices. Common includes activity choices from both packs. Browse Common, All,
Phosphor, or Tabler; typing replaces those filters with “Searching all icons” and
“Both packs” plus a result count. Clearing restores the previous browse scope.
Searching always includes both packs and preserves their distinct stable IDs.

Keep v4 event representation, draft Done/Close behaviour, emoji, no-icon removal,
and all saved Phosphor choices. Tabler IDs participate in validation, replay,
Undo/Redo, archive restore, and backup. No native dependency or store reset.

## 023 — Full Phosphor catalogue and cheaper drag movement

Date: 4 October 2026. Status: founder requested; implemented, phone acceptance pending.

The founder approved expanding Phosphor and confirmed the row-swap flicker is
fixed, but reported reduced frame rate while dragging. Offer the full 1,512
Regular designs from pinned core 2.1.1. Common-first browsing and a virtualized,
searchable full catalogue are implementation choices to retain quick discovery.
Preserve existing choices, IDs, colours, draft semantics, and optional emoji.

Keep row preview sibling order stable and share the existing absolute Y geometry.
Express that Y through translateY from a constant top: 0 layout anchor, rather than
animating top and asking native layout to run on every frame. This also avoids the
old combination of changing layout anchors and compensating transforms. Gesture
recognition and persistence remain unchanged; actual phone smoothness needs checking.

## 022 — Optional habit icons and unchanged row appearance during drag

Date: 4 October 2026. Status: founder requested; implemented, device acceptance
pending. The previous context-menu motion and archive restoration were accepted.

The founder wants optional emoji or pack icons that follow the habit colour. Add
None/Icons/Emoji in the editor, with the existing nested draft, Done, and Close
behaviour. Bundle a searchable selection of 56 regular Phosphor icons and provide
emoji presets plus keyboard/paste input. Catalogue size and presets are assistant
implementation choices; Phosphor is the founder's suggested example. Preserve
name-only rows by default and show chosen icons in the grid, statistics, and archive.

Use a small vendored SVG subset from Phosphor core 2.1.1 with its MIT notice, rendered
through existing react-native-svg. A pinned emoji-regex 11.0.0 dependency validates
single Unicode emoji sequences. No remote icon fetch or native dependency.
Version-4 definitions add an optional namespaced icon string. Keep versions 1–3
readable and unchanged; no SQL schema change or reseeding. Icons participate in
habit Undo/Redo, History, and backups. See [HABIT_ICONS.md](HABIT_ICONS.md).

The founder described the drag translation as smooth but slow, and the switch
from the floating card to the real row as abrupt. Translate the actual name and
date-cell views instead, retaining their contents and appearance during the entire
gesture and drop. Use a faster overdamped spring for neighbour movement and the
final settle. Keep existing hold/menu continuation, cancellation, edge scrolling,
and UI-thread horizontal synchronization.

## 021 — Full-screen statistics and grid-first habit management

Date: 4 October 2026. Status: founder requested and authorized; implemented,
phone acceptance pending. Supersedes the basic statistics and Manage habits UI
in decision 020, retaining its context-menu appearance and storage format.

The founder requested smoother transitions and a full-screen statistics experience
with completion and numeric charts. They identified Settings → Manage habits as
redundant. Add belongs at the end of the grid; active editing, archival, and ordering
remain on habit names. Settings → Archived habits is dedicated to restoration.
Restore uses the existing version-3 definition change; no storage migration.

Use an in-tree full-screen statistics view above the mounted grid, with explicit
Back and Edit controls. This preserves the date position without adding a router.
Native Reanimated layout transitions coordinate name and cell movement, animate
the context menu, and settle the dragged row after a completed drop. Honour Reduce
Motion. No per-frame changes to horizontal synchronization.

Implementation choices, not new founder decisions: 30-day/90-day/year/all ranges,
daily checkbox completion denominators, numeric logging streaks, weekday breakdowns,
and calendar colours. Document these in [STATISTICS.md](STATISTICS.md), including
archive periods, unfinished today, numeric zero, and future-entry exclusion.
Numeric targets and non-daily scheduling rules remain open.

## 020 — Habit-name actions, drag ordering, and management

Date: 4 October 2026. Status: founder authorized implementation; native interaction
acceptance pending. The prior active-History update was accepted by the founder.

Tap a habit name for statistics. Hold for an anchored Colour/Edit/Reorder/Archive
menu, then continue the same touch vertically to drag. Releasing the original
hold leaves the menu open; selecting an option requires a separate tap. Restrict
these gestures to names, keeping date cells direct. Offer explicit reorder mode,
VoiceOver move actions, and Settings → Manage habits for discoverability.

Use native Pressable/PanResponder callbacks with a 380 ms hold and ten-point
vertical threshold, pending phone tuning. The in-tree overlay retains the held
responder; a separate modal menu would interrupt it. Preview ordering without
saving, animate neighbour layouts, and scroll at viewport edges. Completed drops
save one action; cancellation, multiple touches, rotation, backgrounding, and
changed habit identities discard the draft. Preserve horizontal scroll syncing.

Implement creation, name/unit/colour editing, and archival/restoration. Type is
explicit for new habits and read-only after creation in this editor. Numeric
units are optional. Archiving retains values and position; ordering visible rows
retains archived slots. Editors apply drafts with Done and discard with Close.
Basic statistics show recent recorded days, without inventing streak/target rules.

Version-3 events add full habit-definition and order changes, both undoable and
outside correction coalescing. Definition equality ignores field ordering; exact
before-values and complete unique order permutations are required. New exports
use version 3; unchanged v1/v2 fixtures remain supported. No SQL schema change,
destructive reset, or permanent-delete UI. See [HABIT_MANAGEMENT.md](HABIT_MANAGEMENT.md).

## 019 — Active habit History and grouped Undo

Date: 4 October 2026. Status: founder authorized the recommendation; implemented,
updated behaviour awaiting phone confirmation.

Keep global preferences in the unified incremental storage/export format, while
excluding them from visible History and its Undo/Redo sequence. Habit entries
and applied habit colours remain visible and undoable; future habit-definition
edits should follow the same distinction. Preference changes must not discard
habit Redo or interrupt an eligible edit group.

History represents active meaningful actions. Undo removes an action from the
view; Redo restores the original action, without adding undo/redo rows. Repeated
consecutive edits to the same habit field and effective date become one action
using a two-minute inactivity window. A net-zero group disappears. Every edit
still saves immediately; grouping never delays persistence. Show the next Undo
target above the list.

The two-minute rolling window and consecutive-edit boundary are implementation
choices. Another habit/date/field, Undo/Redo, midnight, time-zone changes, or a
backwards clock close the group. A grouped Undo uses one net inverse and one
atomic transaction. Preserve raw edits in append-only storage and exports.

New events and backup containers use version 2. Keep existing v1 records and
backup fixtures unchanged and replay their original semantics; old habit edits
remain separate steps rather than being retroactively grouped. The SQLite schema
stays version 1. See [STORAGE.md](STORAGE.md) for compatibility and validation.

## 018 — Compact, day-grouped change History

Date: 4 October 2026. Status: founder requested; implemented, founder approved the appearance on phone.

The founder asked for action icons, denser rows, and grouping by day so each row
only needs the edit time. Use a native SectionList with sticky day headings,
compact two-line rows, and labelled action icons. Keep Undo/Redo and save status
above the list. Show numeric before/after totals and old/new colour swatches;
keep full meaning available to VoiceOver and allow larger text to expand rows.

Group by the edit instant displayed in the viewing device's local time zone.
Habit-entry dates are separate: add a small For-date label when different from
the edit day. Keep reverse sequence order rather than timestamp sorting;
contiguous grouping preserves chronology even if the clock was adjusted. Batch
loading can extend a day without duplicating or dropping its records.

This changes presentation only; event versions, log contents, persistence,
undo coverage, and backup semantics remain the existing v1 contract. Tests cover
local midnight/DST/travel grouping, pagination, clock rollback, effective-date
labelling, numeric zero/clear, and undo/redo presentation.

## 017 — Durable incremental local storage, undo, and backups

Date: 4 October 2026. Status: founder requested implementation after accepting the
main-page UI; implemented, phone persistence confirmed; older undo report and
backup UI acceptance pending.

Use Expo SQLite with an ordered version-1 event log and a derived JSON projection
committed together. The projection is small and sufficient for the current grid;
separate SQL habit/day tables can be added when queries justify them. Read the
validated log on launch, initialize the sample habits once, and never reset data
on load failure. Preserve explicit date keys and the existing local-midnight
boundary; a later cutoff remains a product choice.

Log accepted entry, colour, and haptic-preference edits with before/after values,
stable IDs, sequence, UTC edit time and local-zone metadata. Apply immediate
optimistic state and serialize writes. Save failure retains the queue, blocks new
edits, and exposes retry. Each accepted action is one undo step; undo/redo append
inverse changes and reconstruct across launches. Initialization and ephemeral UI
actions are not undoable edits.

Implement actual History, JSON change-based backup export, and validated restore.
The v1 container includes a SHA-256 checksum and event count; fully replay it
before asking for native replacement confirmation. Restore keeps a pre-restore
copy in the same transaction; no automatic merge. Browser preview uses a separate
localStorage adapter to preserve Linux layout preview without native SQLite/WASM
setup. See STORAGE.md for the contract and remaining limitations.

Tests cover real SQLite reopen/rollback, initialization, save retry including an
uncertain commit, rapid edits, inverse validation, malformed archives, round-trip,
and restore recovery. Native Expo bridge and share/picker flows remain phone tests.
No cloud service, comment schema, erasure policy, or statistics rules are inferred
from this storage milestone.

## 016 — Visible bar, centred Today, and border pull feedback

Date: 4 October 2026. Status: founder chose always visible and compact; revised placement confirmed on phone; final streak brightness accepted on phone.

The founder requested date, history, and settings controls and chose an
always-visible bar. After the first phone preview they liked the History/Settings
icons and their placement, but rejected moving the date into the bar and Today
into the table corner. They explicitly requested Today top-centre, the date back
in the first table row, and text-free future-pull feedback on the table divider.
They clarified this means the existing divider beneath the date headings, not
a newly added border. The streak should grow left while its right end stays fixed.

The final proposal keeps ONPURPOSE at left, reserves the centre for Today, and
keeps History/Settings at right. Month/year sits beside the day headings, with
the existing date menu. Three equal regions centre Today independent of the
unequal widths of branding and icon controls. Today appears when browsing away;
its space remains reserved. The founder confirmed this revised placement was right.

Replace pull text/progress with a gradient on that existing divider. Its right
endpoint stays fixed; width grows leftwards with pull distance, then fades at its
last width on release. There is no translation, repeating shimmer, or new border.
The founder reported a bright, sunlight-like hotspot and an uneven brightness
ramp. Remove the white peak and trailing dim stop; use a transparent-to-#8A8A8A
alpha ramp so brightness increases continuously toward the fixed right edge.
Keep the threshold haptic and smooth future reveal. Restore month and year as
separate, normally spaced text elements inside the date button.

History and Settings use closable native sheets. Keep the grid mounted and retain
its date position behind them. History is a clear placeholder; Settings supplies
a real haptic toggle for the current session. No persistent settings or history
are claimed. Durable incremental storage with undo is the founder’s requested
next step after the UI is settled, and remains separate work.

Use own SVG outlines via Expo-compatible react-native-svg, avoiding an icon font.
The development capture gesture works on ONPURPOSE, the month/year label, and
dialog/panel titles. Preserve its `__DEV__`/env gating.

## 015 — Continue the future pull without a screen jump

Date: 4 October 2026. Status: founder requested; implemented, founder confirmed the transition is smooth and intuitive on phone.

The founder found the four-day jump disorienting. The old implementation remounted
both lists whenever the future range changed and selected a full screen of future
dates as the new initial position. Remove that remount for expansion. Keep stable
date keys and preserve visible native content while inserting the next 30 dates.

Retain the deliberate 64-point pull-and-release and its single threshold haptic.
Use the released pull distance to choose the nearest whole date, with a minimum
of one new day; a normal pull shows tomorrow next to today in either orientation.
Once both lists have laid out the expanded content, animate the body to that
position and let its UI-thread handler synchronize the header. A new user drag
takes priority. This supersedes decision 010’s full-screen future positioning.

Return to Today still collapses and remounts the range explicitly. Rotation and
Today cancel pending reveal work. Menu access uses the same transition with one
new day beyond the existing edge. Native anchoring and motion need device testing;
automated offset tests alone cannot establish visual continuity. The founder
subsequently tested the new reveal and confirmed it was smooth and intuitive.
Second-batch, interruption, and rotation checks remain in the phone checklist.

## 014 — Restrained action haptics

Date: 4 October 2026. Status: requested by the founder; implemented, revised strength confirmed on phone.

Use the installed Expo Haptics library for immediate, single-pulse action feedback.
Completion/changed save uses Medium, undo/clear uses Soft, discrete selection uses
a selection tick, and the future-pull threshold uses Medium. These mappings are
assistant design choices to tune on the founder's iPhone. Avoid long success
patterns for ordinary checkoff; the development preview's success notification
remains a separate tool response.

Emit feedback only from accepted actions, outside React state updater functions.
Do not await native feedback before updating state. Catch unsupported/native failures;
visual confirmation stays authoritative. No-op saves, cancellations, ordinary
scrolling, typing, and continuous colour sliders are quiet. Future readiness ticks
once per direct drag at the threshold, with no duplicate on release or recrossing.
No new dependency, settings screen, or extra home controls are introduced.

The founder tried the first version and described it as slightly weak. Raise
completion/changed-save feedback from Light to Medium, keeping undo Soft and
selection ticks unchanged. The founder subsequently confirmed the revised feedback was good.

## 013 — Stronger and more consistent cell dimming

Date: 4 October 2026. Status: implemented after inspecting a founder phone preview.

The founder reported that the transition was still not obvious. Their screenshot
shows today beside tomorrow, where date text is dimmer but empty cells remain
similar in strength. The 0.5 lightness floor limited some presets much earlier:
Read's empty mark lost about 12% lightness, while Cook a meal lost about 24%.

Lower the empty-cell floor to 0.38 so all current presets reach the intended 30%
lightness reduction. Keep the separate 0.56 floor for date text. Preserve hue/chroma,
recorded-value emphasis, and the day 5–8 history interval. Arbitrary saturated
custom colours still stop at the sRGB boundary when necessary. This is an
adjustment to decision 012 based on actual phone appearance.

## 012 — Dim by lightness without desaturating

Date: 4 October 2026. Status: founder requested correction; implemented.

The founder rejected the desaturated treatment in decision 011. Preserve hue and
chroma and lower only OKLCH lightness. Fade earlier and faster: the assistant's
new interval starts on day 5 and finishes on day 8. Future empty cells use the
full dimming amount immediately. Recorded values and their date headings retain
normal emphasis.

Use a nonzero lightness floor (0.5 for empty cells, 0.56 for date text). Do not
brighten an already-darker custom colour. If lowering lightness at fixed hue/chroma
would leave sRGB, stop at its gamut boundary instead of reducing chroma. These
lightness limits and the day-8 endpoint are implementation choices to judge on
phone. This supersedes decision 011's chroma reduction and days 8–14 interval.

## 011 — Muted future and older empty cells

Date: 4 October 2026. Status: implemented; visual phone confirmation pending.

The founder wants future dates and entries muted unless recorded, and suggested
similar treatment beyond seven days. They clarified that muting can use OKLCH
and should not require greyscale. Keep each habit's hue while reducing chroma and
lightness. Checked boxes and entered numeric totals (including zero) retain the
selected colour. A date heading returns to normal brightness when any habit has
a recorded value for that date.

The assistant proposes a smooth transition beginning after day 7 and reaching
its maximum at day 14. Fade by calendar age so a date looks consistent regardless
of screen position, orientation, and column count. Bound the fade rather than
continuing to darken distant history. Keep controls active and accessibility
state independent of visual emphasis. This treatment is a phone experiment to
refine with founder feedback.

The founder confirmed scrolling and the colour dialog's Done/close behaviour
work correctly on the phone before this visual change.

## 010 — Smooth scrolling, deliberate future access, and custom colours

Date: 4 October 2026. Status: implemented; founder confirmed smoother scrolling and working future pull.

The founder reported jitter while side-scrolling. Replace JavaScript per-frame
synchronization/state updates with Reanimated UI-thread scroll handlers and send
only settled dates back to React. Install SDK-compatible Reanimated/Worklets;
use native sliders and gradient tracks for colour controls.

The founder now wants future browsing with extra scrolling effort and explicitly
confirmed future entries should be allowed. This supersedes decision 008's
past-only limit. Start at today, require a resisted 64-point pull and release,
then reveal future dates in batches of 30. The month menu supplies an explicit
alternative. Today collapses future columns and restores the boundary while
preserving recorded values. Threshold and batch size are implementation choices
to tune with phone feedback. Future values' treatment in streaks remains a
statistics-design question; statistics are not implemented.

Provide 24 curated colours plus optional custom controls and hex. Use OKLCH
internally, with plain Hue/Colourfulness/Lightness labels and sRGB hex storage.
Offer a contrast hint on black, and preserve exact valid hex choices. Keep the
existing system font pending a deliberate typography comparison.

The founder found the first stacked picker too tall. Use Presets/Custom tabs and
one fixed Done action. The founder explicitly requested Done to apply and close,
and a separate close button to discard changes. All colour selection stays a draft
until Done, including preset choices; there is no additional apply button.

## 009 — Adaptive density and landscape

Date: 4 October 2026. Status: requested by the founder; implemented; founder confirmed both orientations work and stay aligned.

Replace the fixed three-column layout with as many complete dates as the measured
width and system text size can comfortably fit. Enable landscape and use the
extra width for dates; retain safe areas, fixed habit names, and past-only bounds.
Keep the rightmost visible date when rotating. Day touch targets are at least
48 points wide at normal text size, growing with larger text.

The founder questioned the redundant date header. This polish pass keeps a
compact month/year beside the date headings and removes the separate large date
range. This visual treatment is an assistant proposal to evaluate on the phone.
Today remains subtly highlighted; the return action appears only in history,
without moving any rows. Reduce excess vertical space and soften row rules while
retaining colour across habit names, checkboxes, and numeric entries.

## 008 — Past-only grid and habit colours

Date: 4 October 2026. Status: requested by the founder; implemented in the demo.

Start with today and the previous two days; today is the newest allowed date.
Keep names fixed horizontally and date headings visible during vertical scrolling.
Use inverted, virtualized date-column lists, append older dates as needed, and
provide a direct Today jump. Store demo values by stable habit ID and local date,
never by visible column index. Calendar-day arithmetic avoids DST/UTC errors.

Use pure black and a per-habit colour across names, units, checkboxes, numeric
values, and row rules. Habit details include an eight-colour picker. These choices
remain in memory until the incremental storage layer is implemented.

The founder has published the GitHub repository and authorised commits. Commit
local work in coherent changes; preview captures and environment settings remain
ignored. Selecting a licence is still an open project decision.

## 007 — Opt-in local preview sharing

Date: 4 October 2026. Status: requested by the founder; implemented.

Use `.env.local` to enable a development-only screenshot gesture. Native screen
capture supports the visible grid and dialogs; images are uploaded over the LAN
to a paired Node receiver and saved under ignored `.dev/previews/`. No capture
runs without an explicit long press (or accessibility action). Require both the env flag and React Native's `__DEV__` guard.
The release JS should contain no preview capture/upload module. This supports
fast visual feedback without requiring physical-iPhone MCP automation.

The founder requested that the capture control not interfere with the UI. The
visible buttons were replaced with long-press handlers on the existing app
heading and dialog titles. They render the same Text with unchanged styles;
success is communicated by haptics and a VoiceOver announcement, with no popup
or extra layout space. The receiver protocol and saved paths stay the same.

## 001 — React Native, Expo, and TypeScript

Date: 4 October 2026. Status: initial technical choice, revisitable.

The founder suggested React/Expo and develops on Linux with an iPhone available.
Use React Native with Expo for native UI and a cloud path to signed iOS builds.
TypeScript helps catch mistakes during development. Swift-only local development
would require access to Apple's Mac toolchain.

SDK 57 is the current stable npm `latest` checked during setup; SDK 58 has a
`next` tag. Use the stable SDK 57 template and lockfile. Recheck supported SDKs
and Apple's build requirements before beta/release.

## 002 — Small starter, npm, and local checks

Date: 4 October 2026. Status: implemented.

Use the blank TypeScript template, npm, TypeScript, ESLint, and Prettier. Node 24
is already installed. Keep a browser preview for Linux development. Avoid adding
routing, authentication, cloud databases, or state libraries before needed.

## 003 — Stable checkoff positions

Date: 4 October 2026. Status: implemented in demo; product rule confirmed.

Checking a row changes its state, not its position or dimensions. This follows
the founder's muscle-memory goal. The founder confirmed manual ordering, checkbox and numeric types, a three-day
grid, 10–20 habits, and an iPhone 16 Pro. Numeric entry primarily records a daily
total. Column direction, density, and scheduling remain open.

## 006 — Incremental storage and export

Date: 4 October 2026. Status: founder-confirmed direction; schema not implemented.

Store incremental app changes, use them as the full-fidelity export format, and
build a separate history feature over them. Daily habit records are a distinct
view. See STORAGE.md for the proposed log/projection approach and unresolved
format, deletion, date, and restoration semantics.

## 004 — Own the release path, defer account-specific configuration

Date: 4 October 2026. Status: planned.

Use Expo Go for the first phone experiment, then a development build and
TestFlight before App Store release. EAS configuration, bundle identifier, Apple
team, Expo project, and signing credentials are not fabricated in the starter.
Configure them when the founder's accounts and final identifiers are available.

## 005 — Licensing remains a founder decision

Date: 4 October 2026. Status: open.

Open source is confirmed; a particular licence is not. Preserve the generated
Expo template notice separately. Choose a project licence and copyright holder
before publishing the repository. Do not present Expo's copyright as ownership
of the new application.
