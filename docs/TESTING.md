# Testing

## Current checks

Run `npm run check` for TypeScript, ESLint, and formatting. Run `npm run doctor`
for Expo diagnostics, and `npm run export:ios` to catch iOS bundle problems.
An exported JS bundle does not validate native compilation, signing, installation,
or actual phone performance.

Run `npm test` for the domain, receiver, and real SQLite storage tests. The native
store now persists entries, colours, preferences, and undo history. A clean lint
result or browser test alone is not proof that an iPhone habit was saved.

## First iPhone smoke test

- Connect via the steps in DEVELOPMENT.md; record phone model and iOS version.
- Confirm content clears the notch and home indicator.
- Tap sample checkbox cells quickly; every intended change must appear.
- Tap again to undo. Other rows must not move, shrink, or disappear.
- Change the system theme and increase text size; keep all content reachable.
- Enable VoiceOver; each checkbox cell should expose its habit, date, role, and state. Numeric cells
  should expose their value, and names should open details.
- Reload the demo; all changes reset. The bottom demo notice was removed at
  the founder’s request; the grid should use the freed space while respecting
  the home-indicator safe area.

- Enter, edit, cancel, and clear a numeric daily total; other cells stay unchanged.
- Tap a habit name; the statistics placeholder opens without changing values.

## Timed usability study

Use the founder's familiar habit names and agreed order once real habit setup
exists. Learn the positions, then perform at least ten trials checking five checkbox
intended habits. Screen recording or an external recording can aid timing.

Evaluate numeric-entry effort separately. Compare 10, 15, and 20 habits and note
visual searching as well as time.

Record build/version, device, iOS, habit count, text size, cold/warm start,
app-icon tap time, first usable list time, fifth check time, errors, and scrolling.
Report median and slowest icon-to-fifth-check time, plus list-ready-to-fifth-check
time and error count. The user's three-second target includes opening the app.
Do not silently redefine it to exclude launch time.

Use a preview/release build for performance conclusions. Repeat with realistic
habit counts, one-handed use, and accessibility settings; document limitations.

## Before beta — after these features exist

- Completion survives force quit/relaunch and offline use.
- Rapid toggles cannot overwrite a later write with an earlier one.
- Storage errors are visible and retry/recovery does not erase records.
- Midnight while open, background/resume, daylight saving, and travel follow the
  agreed local-day policy without deleting history.
- Renaming, reordering, and archiving preserve IDs and historical records.
- Schema upgrades retain data; test upgrade from an earlier installed version.
- No accidental input through edit controls; primary rows remain stable.
- Physical-device accessibility, contrast, safe areas, and long names work.

- Export/import round-trip and replay reproduce dated values, ordering, and comments.
- History preserves effective habit dates separately from edit timestamps.

## Evidence log

4 October 2026 foundation verification:

- TypeScript, ESLint, and Prettier checks passed.
- Expo Doctor passed all 21 checks.
- The iOS JavaScript/Hermes bundle exported successfully.
- Visual/browser interaction testing was unavailable because this session has
  no connected browser. A successful bundle is not visual verification.
- iPhone runtime verification and all timing trials remain pending.
- npm audit findings remain open; see DEVELOPMENT.md.

4 October 2026 preview-sharing verification:

- The founder confirmed the original demo opens on the iPhone 16 Pro.
- TypeScript, ESLint, formatting, and all 21 Expo Doctor checks passed with the
  capture dependency installed.
- Seven receiver tests passed: saving/retention, pairing, browser-origin rejection,
  malformed payloads, upload size, route restrictions, and disk-write failures.
- An iOS release JS export with preview enabled contained no preview button,
  uploader, RNViewShot module, receiver address, or pairing token.
- The running Metro server's iOS development bundle includes the preview UI and
  local settings. The real receiver starts on the configured LAN address.
- The founder tapped Share preview on the iPhone 16 Pro and reported success.
  A 1206 × 2622 PNG arrived in `.dev/previews/`; the assistant opened it and
  verified the dark-mode three-day grid and preview control. The full physical
  device capture/upload/read workflow is verified for the main screen.
- Dialog/keyboard capture and the phone's failure/retry UI remain manual checks.

The visible buttons have since been replaced with a long press on the app
heading or dialog title. Verify that there is no added layout space, short taps
do not capture, and one sustained press produces only one upload. Successful
uploads provide haptics and a VoiceOver announcement; no success popup appears.
The founder subsequently reported that the gesture works on the physical phone.

Gesture update checks: TypeScript, lint, formatting, iOS bundle export, and all
21 Expo Doctor checks passed. The release bundle excludes the gesture hint,
uploader, RNViewShot module, receiver address, and pairing token. The configured
receiver responded successfully to an authenticated health check.

## Scrollable date grid checks

4 October 2026:

- TypeScript, ESLint, formatting, and the iOS bundle export passed.
- All 12 automated tests passed, including five new calendar tests covering
  past-only dates, batch expansion without shifting existing day identities,
  leap days/month boundaries, Melbourne DST changes, and stable dates at rollover.
- Entries use habit ID plus local date; virtualized columns never own entry state.
- Main background is pure black; eight selectable habit colours apply to row
  labels, units, checkbox states, numbers, and separators.
- The founder shared a phone screenshot of the three-column version. Its main
  grid rendering was inspected; scroll interaction verification remains pending.

Manual checks for the current grid:

1. Open at today and as many preceding days as fit. Swiping past today cannot reveal
   future dates with a light pull. Pull farther and release to reveal future days.
   Swipe older dates through a month boundary and beyond 90 days.
2. Drag both the date headings and the cells: headings and cells should stay
   aligned while habit names stay fixed. Scroll down: headings stay visible and
   names/cells move vertically together.
3. Record different values on two dates, scroll away and return: both keep their
   original values. A swipe must not toggle a cell accidentally.
4. Tap Today to return from history. It should preserve vertical scroll position
   and row order. Try increasing system text size and confirm row alignment.
5. Tap a habit name, select a colour, then Done. Its name, units and entries across
   all dates should update together; its saved-in-memory values should stay put.
6. Check rollover while open and after backgrounding overnight. The grid should
   return to the new today and earlier entries should remain attached to their dates.

To check manually: share the grid, share a dialog, stop the receiver and verify
that an error appears instead of a success message, then restart and retry.
Set the flag false and fully reload to verify the headings stay visually
identical but no longer capture.

## Adaptive grid and visual polish

4 October 2026: responsive columns and portrait/landscape support implemented.
The shared portrait screenshot informed narrower names, a quieter calendar header,
smaller row gaps, and adjusted checkbox/number weights. The founder confirmed both orientations work and columns stay aligned on the
iPhone. No updated captures had arrived at the time of that confirmation, so the
latest visual details have not yet been inspected from a new screenshot. Date
retention when rotating, larger text, and landscape dialogs still need explicit
phone checks.

TypeScript, ESLint, formatting, all 15 automated tests, and the iOS release bundle
export passed. Three new geometry tests cover whole columns, portrait/landscape
widths, minimum touch widths, larger text, and unmeasured layouts. These tests do
not substitute for native gesture and rotation checks.

- Compare portrait/landscape: whole columns fill available width, today stays at
  the right, and all controls clear the notch/home indicator.
- Browse older dates, rotate both ways, and confirm the rightmost date is retained
  with headings/cells aligned. Tap Today and confirm it returns immediately.
- Change text size: fewer days should fit, names can wrap, rows stay aligned, and
  a previously recorded value remains attached to the same date.
- Cross month/year boundaries; the compact heading must describe both months/years.
- In landscape, open a numeric entry and the keyboard, save/cancel/clear it, then
  open colour details. Content and actions must remain reachable by scrolling.
- Compare screenshot density, blank/checked states, and numeric totals. Confirm
  that five rapid checkoffs still hit the intended cells without accidental swipes.

## UI-thread scrolling, future dates, and custom colours

4 October 2026: the founder reported jitter in the prior grid. Source inspection
identified per-frame JavaScript follower scroll commands and React state updates.
The replacement uses native UI-thread synchronization. The founder confirmed
scrolling is smoother and the future pull works on the iPhone. The initial picker
needs layout improvements; the follow-up replaces stacked controls with Presets/Custom tabs and a fixed
Done action. The founder confirmed the shorter layout is better, and requested one Done action
that applies the choice plus a close button that discards it. The founder subsequently confirmed
scrolling and Done/close work correctly on the phone.

All 23 automated tests passed, along with TypeScript, lint, formatting, the iOS
bundle export, and all 21 Expo Doctor checks. The running iOS development bundle
contains compiled worklets. Release export is still not native performance or
App Store validation. Dependency audit findings remain documented in DEVELOPMENT.md.

Automated coverage now includes signed future dates across DST/leap/year edges,
future batch identity, the pull threshold, scroll-to-date mapping before/after
rotation or batch changes, hex validation, OKLCH round-trips/reference values,
gamut mapping, preset contrast, and contrasting checkmarks.

Phone checks for this change:

1. Compare slow drag, quick fling, direction reversal, and a diagonal gesture on
   both header and body. Check alignment during motion, not just after settling.
2. Pull slightly past today and release: it should bounce back. Pull farther:
   progress fills and the label changes to Release for future dates. Release to
   reveal a screenful of future dates. A fling alone must not unlock them.
3. Enter a future checkbox and numeric total, return to Today, then reveal again.
   Both values must remain tied to their dates. Pull again at the future edge to
   extend the range. Try the month menu with VoiceOver as well.
4. Rotate in history and in future dates; confirm date and row alignment. Repeat
   at larger text sizes. Values must not migrate when column counts change.
5. Select presets; switch to Custom; adjust each slider; type valid shorthand
   and six-digit hex, then invalid text. Only Done commits any draft and closes. Close must discard preset, slider, and
   hex changes; reopening must show the last committed colour. Invalid hex disables
   Done. Check low-lightness contrast guidance and black/white checkmarks.
6. Test picker scrolling and hex keyboard in both orientations. Share a preview
   by holding the habit title. Reload still resets demo entries/colours.

## Muted future and older empty cells

4 October 2026: implemented OKLCH muting while preserving habit hue. Empty future
cells are muted immediately. History fades smoothly after day 7, reaching maximum
muting at day 14. Checked boxes and recorded numeric totals retain their colour;
any recorded value also restores that date heading's brightness. Explicit numeric
zero counts as recorded. Phone visual confirmation for this treatment is pending.

TypeScript, lint, formatting, and the existing five colour tests passed. A numeric
check across the preset palette found the weakest fully-muted empty numeric mark
has 4.22:1 contrast against black; the fully-muted date number has 8.23:1. These
checks do not establish contrast for arbitrary custom choices, which already have
contrast guidance in the picker. The iOS export is checked before committing.

Phone checks:

- Reveal future dates: compare an empty cell, a checked box, and an entered total.
  Check that the cells remain usable, and their hue still relates to the habit.
- Check, then undo the last completion on a future date. Its heading should regain
  brightness and then return to muted. Repeat with entering/clearing numeric zero.
- Browse days 7–14: the transition should be gentle with no abrupt boundary.
  Recorded values should stand out against empty neighbours.
- Rotate and return to the same date. Its emphasis should follow age rather than
  position. Try at least one saturated preset and a darker custom colour.

## Lightness-only dimming correction

4 October 2026: the founder rejected the desaturated appearance. Dimming now
retains OKLCH chroma/hue and changes only lightness, bounded by a visible floor
and the sRGB gamut. History fades from day 5 to day 8; future empty cells are
fully dimmed. The day-8 endpoint and dimming strength still need phone judgment.
The contrast measurements above describe the superseded desaturated treatment.

Check days 4–8 for the faster transition. Compare empty future/history controls
against a completed value in the same row: the hue should stay recognisable and
vivid while brightness decreases. Test a saturated custom colour and distant
history; colours must stop dimming rather than disappearing. Recorded zero,
undo/clear, date-heading emphasis, scrolling, and rotation should retain their
previous behaviour.

Correction verification: TypeScript, lint, formatting, five existing colour tests,
and the iOS export passed. A direct check across presets and saturated/dark custom
samples confirmed lower nonzero lightness with chroma preserved within 0.0013
of the original after hex rounding. Updated phone appearance remains to be judged.

## Stronger empty-cell dimming

4 October 2026: inspected the founder's 1206 × 2622 phone capture showing today
beside tomorrow. Future date text is visibly subdued; differences in empty cells
are much less consistent. Numeric checks identified the 0.5 lightness floor as
the limiting factor for the current palette (12–24% reduction rather than 30%).
The empty-cell floor is now 0.38; date text keeps its separate 0.56 floor.

A direct check confirmed all eight demo colours reach about 30% lower OKLCH
lightness while retaining chroma/hue. Judge the revised result on the phone,
particularly Read, Drink water, and the today/tomorrow boundary. Checked values
and recorded totals should continue to stand out. History still fades on days 5–8.

## Action haptics

4 October 2026: implemented single-pulse completion/confirmation, softer undo/clear,
selection ticks, and one future-ready threshold tick per direct drag. Physical
feel and first-tap latency need founder evaluation on the iPhone 16 Pro.

Phone checks:

- Check five separate habits quickly. Each accepted tap should get one short
  pulse and immediate visual feedback, with no queued pattern afterwards.
- Undo a check; compare its softer feedback. Swipe starting over a cell: cancelling
  the press to scroll must not produce a checkoff pulse or change its value.
- Open a numeric editor, save a changed value, save it again unchanged, clear it,
  and Cancel. Opening selects, changed save confirms, clear gives undo; unchanged
  save and Cancel are quiet. Include zero as a recorded value.
- Select different colour presets/tabs; repeated selection is quiet. Drag sliders
  and type hex: no per-step buzzing. Done confirms only an actual applied colour
  change, while Close stays quiet and discards it.
- From both header and body, pull to future readiness: one firmer tick. Move back
  and forth across the threshold without lifting: no extra tick. Release: no second
  pulse. A fling or an under-threshold pull must not produce the readiness tick.
- Return to Today: one selection tick for a real jump. Already at the normal
  Today boundary, the menu's no-op return should stay quiet.
- Repeat with iOS Low Power Mode or haptics disabled: UI actions must still work.
  Native feel cannot be established by tests or Linux bundle export.

Verification: TypeScript, ESLint, Prettier, all 23 existing automated tests, and
iOS production bundle export passed. The founder tested the first version on
the iPhone and found it slightly weak; completion/changed-save feedback was
raised from Light to Medium. The founder subsequently confirmed it was good.

## Continuous future reveal

4 October 2026: replaced the full-screen future jump with preserved native lists
and an animated continuation based on the released pull distance.

- From Today, release near the threshold: tomorrow should appear beside today
  without a blank frame, list reset, or header/body separation. A shorter pull
  must bounce back without unlocking dates.
- Pull farther: travel should follow the pull distance, then snap to a column.
  Portrait and landscape should reveal the same number of days for the same
  physical pull/column width, rather than jumping their different screen widths.
- Continue scrolling into the unlocked range, reach its far edge, and reveal a
  second batch. The previous edge date must retain its position as dates load.
- Interrupt the reveal with another drag. User control takes priority.
- Try the month menu’s future action from both Today and history. It should
  animate into the next future date, with the header staying aligned.
- Return to Today, pull again, rotate, then scroll back into history. Verify the
  normal Today boundary returns and values remain attached to the same dates.

TypeScript, ESLint, Prettier, all 24 tests, and iOS production export passed. The
new regression test verifies the first reveal brings tomorrow beside today at
different viewport/column sizes, plus larger pulls and successive future batches.
The founder evaluated the revised reveal on the iPhone and reported “Smooth and
intuitive”. The broader second-batch, interruption, menu, and rotation checks
above remain a regression checklist, not individually confirmed test results.

## Compact top bar and native panels

4 October 2026: the founder chose an always-visible compact bar and then refined
the first phone preview. History/Settings icons and placement were approved;
the initial date/Today placement was rejected. The revised layout puts Today
top-centre and month/year back beside the day headings.

- Check portrait, landscape, and larger system text: the brand, centred Today,
  and right-hand icons must not overlap. Month/year remains beside date columns.
- Tap month/year: the existing date actions open. Long-press ONPURPOSE or
  month/year: save a preview without opening a date menu afterwards. Test the
  VoiceOver Share preview action too.
- Scroll back, reveal the future, and return via Today. Its appearance must not
  move controls, date columns, or habit rows.
- During a future pull, a gradient streak grows leftwards from a fixed right endpoint
  on the existing divider beneath the dates. No instruction text or new border
  appears. Brightness ramps smoothly from transparent left to muted grey right,
  without a white hotspot or a dimming right cap. On release/cancellation it
  fades at its last width. The single
  readiness haptic and smooth continuation into tomorrow must still work.
- Try with iOS Reduce Motion enabled: the release fade follows system policy;
  direct pull feedback remains visible. There should be no animation while idle.
- Open History/Settings from a scrolled position; close using Close and iOS swipe
  dismissal. The same dates and vertical position remain visible. Closing History
  must not flash Settings during dismissal.
- Turn haptics off: checkoffs, numeric saves, presets and future readiness are
  silent. Turn it on: the switch confirms and feedback resumes. Reload restores
  this temporary preference to its default.
- History clearly says it is coming next, without fabricated events or a
  nonfunctional undo control. Capture works by holding either panel title.

TypeScript, ESLint, Prettier, all 24 tests, iOS export, and all 21 Expo Doctor
checks passed for the panel/icon foundation. Static checks and iOS export also
passed after the revised placement and border animation. Revised native feel
remains under refinement. The founder confirmed the revised placement is right,
but requested tuning of the streak and normal date formatting. The final
correction anchors the streak on the existing divider and restores separate
month/year text within a single date button. The founder then identified a
bright hotspot and uneven gradient; the latest version replaces that with one
muted-grey alpha ramp. Final acceptance of this brightness adjustment is pending.
The initial screenshot proved
month-label capture works, but does not establish acceptance of the revised UI.

The colour picker destructures preset hex before JSX style use, avoiding
Worklets’ false-positive warning for plain objects named `.value` without
disabling actual animation diagnostics. A development Babel transform confirmed
no `getUseOfValueInStyleWarning` call is injected for these preset styles.

## Incremental persistence and backup — 4 October 2026

Automated: 45 tests passed, including 21 focused storage tests against the actual
SQL/replay/queue/archive modules. TypeScript/lint/format, iOS and web exports passed;
Expo Doctor passed 21/21. Node SQLite tests use memory and a reopened disk file;
they are not a test of Expo's native bridge. A separate development-host replay
check processed 50,001 synthetic events in approximately 191 ms; do not infer
native launch performance from this number.

Tests cover explicit zero/clear, backdated/future dates, malformed values and
versions, duplicate IDs/missing order, inverse targets, redo branching, 101 rapid
same-cell edits, persisted colours/settings/undo, failed projection writes,
idempotent retry after an uncertain commit, projection repair, protected corrupt
logs, rejected newer databases, atomic initial setup, checksum round-trip and
malformed archives, restore rollback, retained pre-restore copies, exclusive
backup work, startup retry, undoing every recorded edit after reopening, long-log
replay without source mutation, the checked-in example export, and browser quota
failure. No storage fixtures contain real founder data.

Phone evidence: the founder confirmed checkbox/numeric entries, colour, and the
haptic preference survive reloading, and said the feature works overall. They
reported some older changes appeared impossible to undo, from before refreshing.
Clarification is pending about whether those actions exist in the persisted
History or predate the transition from temporary state. Do not claim this undo
report resolved solely from automated tests.

Remaining iPhone checks:

1. Record five checkbox changes rapidly, undo and redo them, fully close/reopen
   Expo Go, and repeat. The newest remaining habit action is the next undo; its
   row disappears on Undo and returns on Redo. Test another day and tomorrow,
   and a numeric explicit zero. See the grouped-action checks below.
2. In Settings wait for Saved, export via Save to Files, and verify a JSON file
   exists. Cancelling sharing must not alter data or claim an external backup.
3. Make a fresh entry after exporting, restore that file, and inspect the native
   count/replacement confirmation. Cancel once first. Confirming must restore the
   exported state and its undo stack. Restore pre-restore copy must bring back
   the fresh entry. Reopen to verify persistence of the copy.
4. Try a malformed file; validation must reject it without changing the grid.
5. Try force-quitting after Saved, and separately immediately after rapid edits.
   Record any uncommitted loss honestly; there is no guarantee after a force kill
   before writes finish. Test offline, midnight rollover, timezone changes, and
   larger accumulated histories in a development/release build.
6. Verify VoiceOver labels/disabled Undo/Redo, large text and landscape in History
   and Settings, safe-area dismissal, and no grid position change after closing.

Permanent corruption has no destructive auto-reset. Developer-assisted recovery
and external backups are the current recovery path for an unreadable log.
Uninstalling Expo Go/a standalone build may remove its container. Expo Go data
will not automatically appear in a standalone app; use export/restore.

The dependency audit reports 28 transitive findings (8 moderate/20 high), compared
with 27 before the storage dependencies. The extra report is expo-sharing through
the already-used @expo/config-plugins chain; npm proposes an incompatible older
major as its fix. No forced dependency downgrade was applied. Resolve the SDK's
audit findings before release; successful Doctor/export checks do not resolve them.

## Compact grouped History — 4 October 2026

Implemented on founder request: dense action-icon rows with time at right,
sticky edit-day headings, fixed save status and Undo/Redo controls. Numeric rows
show before/after values; colour rows show paired swatches. A differing entry
calendar date uses a For-date caption. Grouping uses the viewing local zone;
event sequence and stored data remain intact.

Automated: the full suite passes 53 tests, including eight new History tests for
local-midnight grouping, pagination into one day, clock rollback order, daylight
saving and travel, effective habit dates, numeric zero/clear, undo/redo, settings
and year-boundary headings. TypeScript/lint/format and iOS bundle checks pass.
The founder approved the appearance on the iPhone. No screenshots of this
revised layout have been inspected; large-text/VoiceOver and paging checks remain
to be confirmed. Behaviour changes to filtering settings, undo presentation, and
repeated-toggle grouping were subsequently authorized; see the following milestone.

Phone checks: inspect normal and large text, long names, colour changes, explicit
numeric zero, past/future corrections, undo/redo, pending/retry status, sticky
heading readability, and older-record loading. VoiceOver should read a whole row
once with habit/action/effective date/time; icons and swatches are decorative.
Same-day rows should not repeat the date. Confirm closing History still preserves
horizontal grid position, and no changes to entries are made by browsing.

## Active actions and grouped Undo — 4 October 2026

Implemented: global preferences save outside visible History/Undo, retaining
habit Redo. Undo removes a row and Redo restores the original action. Consecutive
corrections to one entry/field coalesce within two minutes of inactivity, net-zero
groups disappear, and a target description explains the next Undo. Every raw edit
still writes immediately. New version-2 events/containers retain legacy v1 import
and replay; the SQLite schema stays version 1.

Automated: all 67 tests pass, along with TypeScript, lint, formatting, and an iOS
production bundle export. Coverage includes grouping/cancellation/resumption, numeric net Undo,
exact inactivity boundaries across reopen, separate habits/dates/fields,
midnight/zone/clock changes, preferences preserving Redo, Undo/Redo boundaries,
atomic grouped-undo failure/retry, backup round-trips, legacy preferences and
abandoned redo branches, rejected malformed groups, and synthetic v1/v2 fixtures.
Phone acceptance of the new behaviour remains pending; prior persistence and
History appearance approvals do not establish this milestone's native behaviour.

Phone checks:

1. Check/uncheck an empty cell rapidly: no active row remains. Check again:
   one row returns. Undo removes it; Redo restores it with its original time.
2. Set a numeric total, then correct it several times: one row shows the initial
   value → final total. Undo restores the initial value in one step. Repeat after
   two minutes of inactivity: a separate correction appears. Test explicit zero.
3. Change another habit/date between corrections: they remain separate actions.
   Undo/Redo followed by a correction also starts a new group.
4. Toggle haptics: no History row, no changed Undo target, no lost Redo. Reload:
   values, preference, grouped actions, and Redo survive. Old v1 habit edits remain
   separate steps; their settings and undo/redo rows are hidden.
5. Export/restore through Files, verify both a v1 backup and a v2 backup. Inspect
   target labels and save/error status with large text, landscape, and VoiceOver.

## Habit actions and management — 4 October 2026

Implemented: tap-name statistics, held-name anchored menu, continuation into drag,
explicit Reorder mode, edge scrolling, cancellation, VoiceOver move actions,
creation/editing/archival/restoration, and version-3 persistent definition/order
changes. Statistics show recorded-day counts and a recent fourteen-day view;
future entries are excluded. Targets and streak rules remain undecided.

Automated: all 74 tests, TypeScript, lint, formatting, and iOS bundle export pass.
Coverage includes SQLite management reload/Undo/Redo and archive round-trips, exact
identity/position/order validation, unitless numeric zero, independent structural
Undo steps, empty v3 initialization, older format boundaries, unchanged v1/v2
fixtures, archived reorder slots, and variable-height drag destinations. Native
responder recognition, overlay placement, auto-scroll feel, and nested iOS sheets
remain phone checks; bundle success alone does not establish their behaviour.

Phone checks:

1. Tap a name: statistics opens. Tap cells: recording remains immediate. Hold
   without moving: haptic and menu; release leaves it open without selecting an
   option or opening statistics. Tap outside to dismiss. Try top/bottom rows.
2. Hold then drag without lifting: menu disappears, row follows, neighbours move,
   and cells do not toggle. Release saves one order action. Undo restores the
   original order without changing values; Redo restores the move. Reload.
3. Drag near both viewport edges with 20+ rows. Normal swipes before a hold should
   scroll. Add a second finger, rotate, or background the app during a drag:
   cancel without saving a partial order. Try explicit Reorder → Done too.
4. Settings → Manage habits → Add: create checkbox and unitless numeric habits,
   choose colours, and enter zero. Edit names/units/colours. Done applies; Close
   discards, including nested picker changes. Check keyboard and landscape.
5. Archive a recorded habit; it leaves the grid while History/data remain. Restore
   it at its retained position. Archive all rows; Add remains available. Export,
   edit, restore, reopen, and undo management actions without reseeding.
6. Inspect larger text and VoiceOver. Name actions include Move up/down and direct
   editing. Background controls should be hidden from VoiceOver while the menu is
   open. Confirm closing panels preserves the horizontal date position.

## Full-screen statistics, motion, and archive-only management — 4 October 2026

Supersedes the basic-statistics and Settings → Manage habits steps above.
Implementation complete; all 83 tests, TypeScript, lint, formatting, and iOS
production bundle export pass. Founder confirmed the context-menu transition is
smoother and Add/archive/restore retain entries and position on the phone. The
first drag animation felt harsh, and the selected name was not reachable after
leaving the menu open. A damped spring, a backdrop cutout over the selected name,
and a hold-state reset restricted to new touches address this feedback; these
follow-up gesture changes and statistics acceptance remain pending.

Automated coverage adds nine statistics tests to the previous 74, including daily
rate boundaries, zero versus missing, future exclusion, archive/restore and
Undo/Redo lifecycle, timezone/leap-day arithmetic, aggregation, clock rollback,
and all three unchanged storage fixtures. Existing SQLite reload, archive and
restore, reorder/Undo, and recovery tests remain in the full suite.

Phone checks:

1. Tap a checkbox name: full-screen statistics slides in. Try 30D/90D/1Y/All,
   inspect chart periods, browse months, and return Back. The grid should retain
   its date and vertical position. Edit a name/colour from statistics; closing
   the editor returns to updated statistics.
2. Compare a numeric habit with a recorded zero, a blank day, and a future value.
   Zero is included in averages, blanks are omitted, and the future value does
   not inflate totals or streaks. Checkbox rates exclude unfinished today.
3. Hold a name and release: menu appears without activating anything. Wait with the menu open before
   dragging; also release, then hold the selected name again and drag. Neighbours and their date cells should move together. Drop should settle
   smoothly and save one Undo step. Recheck edge scrolling, interrupted drags,
   quick successive drops, and rotation. Try system Reduce Motion too.
4. Add habit at the end of the list. Archive a recorded habit; Settings → Archived
   habits should list it with Restore. Restore, return to the grid, and check its
   entries and retained slot. Reload and verify persistence and History Undo.
5. Try the statistics screen and archive list in landscape, larger text, and
   VoiceOver. Check chart increment/decrement actions and calendar announcements.
   Holding Statistics, the habit title, or Archived habits sends a dev preview.

## Optional icons and actual-row dragging — 4 October 2026

Implemented after founder feedback: optional None/Phosphor/Emoji selection, saved
icons in grid/statistics/archive, version-4 events/backups, and dragging the actual
row with a faster spring. The earlier translation was confirmed smooth but too
slow; its visual swap was rejected. This revision awaits device acceptance.

Automated: 89 tests plus TypeScript, lint, formatting, and an iOS production export.
New coverage checks single emoji sequences, invalid inputs, stable pack IDs with
bundled glyphs, icon-only History descriptions, SQLite reload/removal, Undo/Redo,
archive restore, old-format rejection of icons, version downgrade protection,
and a new v4 backup fixture preserving the unchanged v3 prefix.

Phone checks:

1. Edit a habit → Icon → search Icons or enter Emoji. Inner Done updates the draft;
   outer Done saves. Close should discard the current draft. None removes the icon.
   Change colour and confirm pack icons follow it while emoji keep their colours.
2. Reload, Undo/Redo the icon edit, archive/restore, and export/restore via Files.
   Confirm the same icon and entries return. Try numeric habits with long units.
3. Hold/wait/drag and release/re-hold/drag from an open menu. The actual name,
   optional icon, units, and date cells should move together and retain their
   appearance when dropped. Neighbours should settle quicker than the prior build.
4. Recheck variable-height names, both viewport edges, large text, landscape,
   multi-touch cancellation, backgrounding, Reduce Motion, and VoiceOver move actions.

## Row-swap flicker — 4 October 2026

The founder confirmed the drag/drop appearance change was resolved, but observed
flashes of wrong positions during swaps. ReorderRow now uses a single absolute
animated Y position, with stable preview sibling order and shared preview/drop
geometry. Inner name controls provide height measurements. The context-menu
appearance and faster spring remain unchanged.

Automated: 91 tests, code checks, and iOS production export pass. New geometry
coverage exercises wrapped/taller rows, every drag destination, constant content
height, no gaps, and matching preview/committed positions. Native flicker removal
still needs phone verification.

Phone: hold a name until its menu is open, then drag slowly across three rows and
back; repeat with a quick drag, a tall name, and near both scroll edges. Check that
name and date cells move together without flashing at another Y position. Drop,
Undo, and reload to confirm only the completed order change persists. Check both
orientations and larger text, since row containers now use explicit total heights.
