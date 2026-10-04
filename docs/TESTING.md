# Testing

## Current checks

Run `npm run check` for TypeScript, ESLint, and formatting. Run `npm run doctor`
for Expo diagnostics, and `npm run export:ios` to catch iOS bundle problems.
An exported JS bundle does not validate native compilation, signing, installation,
or actual phone performance.

The initial demo has no persistence or complex domain logic. Introduce focused
automated tests as those behaviours arrive; don't treat a clean lint result as
proof that a habit was saved.

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
raised from Light to Medium. The revised strength still needs a phone comparison.
