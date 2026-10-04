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
- Reload the demo; all changes reset, matching the visible demo notice.

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
The gesture itself still needs verification on the physical phone.

Gesture update checks: TypeScript, lint, formatting, iOS bundle export, and all
21 Expo Doctor checks passed. The release bundle excludes the gesture hint,
uploader, RNViewShot module, receiver address, and pairing token. The configured
receiver responded successfully to an authenticated health check.

To check manually: share the grid, share a dialog, stop the receiver and verify
that an error appears instead of a success message, then restart and retry.
Set the flag false and fully reload to verify the headings stay visually
identical but no longer capture.
