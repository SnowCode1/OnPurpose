# OnPurpose — project goals

Status: living product brief. Last updated: 5 October 2026.
“OnPurpose” is a working name, not a final brand or reserved App Store name.

## Primary goal

**Minimise cognitive friction so habit tracking becomes a seamless part of life.**

Make the gap between remembering a completed habit and recording it as small as
possible. Open the app, tap familiar positions, and leave. Speed matters because
it reduces interruption; the app should also minimise reading, decisions, errors,
and uncertainty about whether something was saved.

## Confirmed by the founder

- Build an iOS habit tracker intended for an actual App Store release.
- Release the source under an open-source licence, still to be selected.
- Use a compact, spreadsheet-like home screen: habits run vertically, dates run
  horizontally. Fit as many whole day columns as space and text size allow;
  support portrait and landscape, with more dates visible in landscape.
- Start at today and the recent past. Scroll horizontally into the past;
  ordinary scrolling stops at today, with an intentional extra pull to reveal
  future dates. Future checkbox and numeric entries are allowed. This supersedes
  the initial past-only rule. Adaptive density replaces the three-column idea.
- Use a pure black background and user-selectable habit colours across each row,
  including the habit name, checkboxes, and numeric entries. Provide more presets
  and a visual custom picker with optional hex input; use familiar user-facing
  labels rather than colour-space jargon.
- Optionally give a habit an emoji or a pack icon. Pack icons use the habit colour;
  icons remain optional. Give all 12 presets suitable icons; preserve user choices
  when adding them to an existing preset list. New custom habits start without one.
  Offer Phosphor and Tabler Outline with shared search and common habit choices.
  Open the picker on Icons and make its full search scope explicit.
- Mute unused future dates and entries while keeping recorded values prominent.
  Preserve habit hue and colourfulness; reduce only OKLCH lightness with a floor
  so empty cells remain visible. The history fade starts at day 5 and reaches its
  dimmest level at day 8, then stays bounded.
- The founder has published the repository at https://github.com/SnowCode1/OnPurpose
  and authorised local commits. A project licence is still to be selected.
- Use [Loop Habit Tracker for Android](https://github.com/iSoron/uhabits) as a
  product reference. This is inspiration for behaviour, not a decision to copy
  its code, assets, scoring formula, or every feature.
- Support checkbox habits and numeric habits. Numeric entries are primarily a
  daily total, rather than repeated increments throughout the day.
- Add restrained haptic feedback to recording and deliberate selections. Keep
  rapid checkoff immediate and routine scrolling quiet.
- Keep a compact top bar always visible, with Today in the centre and change
  history/settings at right. Keep the month/year date control beside the day
  headings. Future-pull feedback should grow leftwards from a fixed right edge
  on the existing divider beneath the day headings, without text or a new border. The founder accepted this UI; local incremental storage with undo is now implemented.
- Let users arrange their own habit order. Completed habits stay in place.
- Design for muscle memory; the aspiration is opening the app and recording five
  checkbox habits in about three seconds.
- Plan for approximately 10–20 habits. The primary test phone is an iPhone 16 Pro.
- Tapping a habit opens full-screen statistics, including streaks, completion-rate
  charts for checkboxes and numerical charts for daily totals.
- Tap days in the statistics calendar to toggle checkboxes or edit numeric totals
  using the same entry behaviour as the grid. Today navigation scrolls back quickly.
- Hold the habit name for a compact Colour/Edit/Reorder/Archive overlay. Continue
  holding and drag to reorder; include an explicit mode and accessible move actions.
  Keep date-cell recording gestures separate. Add habits at the end of the grid;
  Settings contains an archived-habit restore list, not duplicate active management.

- Store app changes incrementally. This is the underlying storage approach and
  export format, separate from the habit/day model; it also enables a separate
  history feature for browsing prior activity, checked boxes, and comments.
- Show change history in compact rows with action icons, grouped by edit day,
  with time per row. Preserve clarity about different habit-entry dates.
- Keep global preferences in incremental storage/export but outside visible
  History and Undo. Show active habit actions: Undo removes their rows and Redo
  restores them. Group rapid corrections to one entry and hide net-zero groups;
  show the next Undo target. Start with two minutes of inactivity between groups.
- Give each habit an optional Markdown/plain-text description with links, available
  during creation and editing. Show it first in statistics in a distinct compact
  rounded card, with a full-screen live formatted editor, local temporary Undo/Redo,
  reversible formatting controls and optional highlight colours. Retain applied changes in incremental storage and Undo/Redo. Populate existing
  habits with editable placeholder notes while preserving any user-written text.
  Keep formatting controls above the keyboard, float text/colour menus without
  shifting the document, and let pasting a URL onto selected words create a link.
  Show current highlight colour, offer explicit link Open/Edit/Remove inspection,
  and provide description Versions beside Edit with undoable text-only restore.
- Give each habit an editable start date, initially Today, to support old records.
  Statistics use each habit's own continuous calendar period since its start;
  another habit's activity must not affect its denominator. Numeric averages divide
  by all calendar days in the selected period since the start, including blanks.
- Allow pulling down from the top of statistics to return to the grid.
- Offer saved row- and column-spacing settings.
- Develop without owning a Mac; use the physical iPhone for actual testing.
- Maintain project goals, agent guidance including CLAUDE.md, and a docs folder.

## Proposed interaction rules

1. Launch directly into the current grid after initial setup.
2. Tap a checkbox date cell once to toggle it; show the result immediately.
3. Tap a numeric date cell to enter/edit that day's total.
4. Tap the habit name to open statistics. Names and date cells have distinct hit
   targets, so recording a value cannot accidentally open statistics.
5. Keep today at the right edge of the initial view. Scroll toward
   earlier dates while names stay fixed; offer a direct return to Today. Reveal
   future days after a deliberate pull-and-release, continuing by the pull distance
   rather than jumping a whole screen. Returning to Today restores
   that boundary; entries keep their dates.
6. Change ordering only through deliberate editing, not automatic sorting.
7. Save locally and work offline; do not require an account for everyday tracking.
8. Use restrained haptics for accepted actions, with no blocking celebration.
   Pulse choices are a phone experiment; visual state must remain sufficient.
9. Preserve readable text, VoiceOver support, and usable touch targets. Scroll
   when necessary instead of squeezing all 20 habits into uncomfortably small rows.

Manual ordering and stable completed positions are confirmed. The remaining
interaction details are proposals to validate on the phone.

## Two kinds of history

**Habit/day history** answers “What did I record for Tuesday?” and supports
statistics based on dated values. The home grid is a view of those records.

**Change history** answers “What changed, and in what order?” The incremental
storage system preserves mutations and supports export, restoration, and a
separate history-browsing feature. A correction made today to Tuesday's value
has two different dates: the date being recorded and the time of the edit.
Comments belong in this history design too. See [STORAGE.md](docs/STORAGE.md).

The architectural direction is confirmed. Version-4 events, grouped compensating
undo/redo, and JSON change-based backup/replay are implemented, retaining support
for existing version-1/2/3 records and backups. The visible History is an active-action
projection; the exported log retains every accepted edit. Comments, permanent erasure,
and richer historical browsing still need design. See docs/STORAGE.md.

## How we will judge the experience

The three-second target is an aspiration to measure, not an achieved claim.

- On the iPhone 16 Pro, time from tapping the app icon to the fifth intended
  checkbox visibly becoming complete, after learning the layout.
- Record cold launch and warm return separately. Also measure from the grid
  becoming usable, to separate launch cost from interaction cost.
- Run at least ten trials. Record wrong taps, corrections, scrolling, and whether
  the user had to stop and search for the next habit. Report median and slowest.
- Repeat with 10, 15, and 20 habits; do not hide scrolling cost from the results.
- Evaluate numeric entry separately: entering a total is a different task from
  checking a box, and is not automatically subject to the five-in-three target.
- Use a preview/release build for final timing. Expo Go and web previews help
  layout iteration but do not establish release iOS performance.
- Check reliability: saved values survive reopening, offline use works, and
  completion never unexpectedly changes other rows' positions.

Final acceptance thresholds are still to be agreed. See [TESTING.md](docs/TESTING.md).

## First-release candidates and sequencing

The following capabilities are desired; their milestone order is proposed:

1. Validate the compact grid, distinct name/cell actions, and numeric daily entry.
2. Design versioned incremental storage and portable export/restoration.
3. Implement real habit creation, editing, manual reordering, archival, and durable
   checkbox/numeric entries, including date rollover and earlier-day corrections.
4. Add habit detail statistics and streaks with clearly specified calculations.
5. Add comments and the separate history browser on top of the same stored changes.
6. Validate accessibility, data recovery/upgrades, TestFlight, and App Store release.

The current starter uses 12 sample habits in a grid with an adaptive day viewport
(typically four columns on the test phone in portrait, more in landscape, fewer
with larger text). It supports scrolling into the
past, returning to Today, editing dated checkbox/numeric values, automatic local
date rollover, deliberate future browsing/entries, and choosing preset or custom
row colours in habit details. Habit creation, name/unit editing, manual ordering,
and reversible archival are implemented. Tapping names opens full-screen trends,
weekday breakdowns, a calendar, and daily checkbox/logging streaks; holding opens
actions and supports dragging. Current daily statistics rules are implementation
choices documented in [STATISTICS.md](docs/STATISTICS.md); targets and schedules remain
undecided. History lists active habit actions with grouped undo/redo. Entries, colours, and the haptic preference
persist locally in SQLite; Settings supports full change-based backup/restore.
The 12 sample habits are seeded once and can be edited or archived. Persistence is confirmed on phone; an older-undo report and
backup acceptance testing remain pending.

## Deferred candidates, not permanent exclusions

Cloud sync, accounts, social features, leaderboards, coaching, AI features,
reminders, widgets, Apple Watch, and Android release support. Each needs a
concrete reason to enter the first release. Statistics, numeric habits, comments,
and incremental history are desired scope, not excluded candidates.

## Decisions to make together

| Question                                                               | Current status                                                     |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------ |
| How many dates and in which direction? How do we browse history?       | Adaptive columns; deliberate future reveal; future entries allowed |
| All habits daily, selected weekdays, or frequency targets?             | Open                                                               |
| Do numeric habits have units, targets, and a “lower is better” option? | Daily-total input confirmed; goal rules open                       |
| What exactly counts toward a numeric or scheduled habit's streak?      | Open                                                               |
| Midnight cutoff, late-night logging, backdating, and travel?           | Local midnight implemented; later cutoff/travel policy pending     |
| Comments on a habit, a day, a particular entry, or multiple kinds?     | Comments desired; attachment semantics open                        |
| Which app changes enter the history; how do deletion and undo work?    | Active habit actions; preferences excluded; deletion/erasure open  |
| Export/import format, backup location, and cross-device sync?          | Version-6 JSON backup; v1–v5 import retained; sync deferred        |
| Any reminders or widgets required for version one?                     | Open                                                               |
| Free, paid, donations, or another model?                               | Open                                                               |
| Licence and copyright holder?                                          | Open; choose before public release                                 |
| Final name and visual personality?                                     | Name open; black background and habit colours confirmed            |
| iOS version, Expo account, Apple Developer membership?                 | iPhone 16 Pro confirmed; account/OS status open                    |

## Milestones

1. **Foundation:** local tooling, shared goals, phone setup guide, disposable grid.
2. **Interaction validation:** actual phone testing and agreement on core behaviour.
3. **Usable local app:** incremental storage, export/restore, management, dated entries.
4. **History and insight:** statistics, comments, and browsing previous changes.
5. **Beta:** own builds, TestFlight, accessibility, reliability, timed usability trials.
6. **Open-source and App Store release:** licence, public repo, final assets,
   accurate privacy details, App Review, publication.

## Next suggested work

1. Validate local saving, undo, and backup/restore on the iPhone before daily use.
2. Validate the implemented editor, action menu, archival, and reordering on phone.
3. Consider a date picker for jumping to a distant date without repeated swipes.
4. Discuss an explicit “skipped/not applicable” value before calculating streaks,
   so intentionally skipping a habit need not look like a missed day.
5. Refine the implemented haptic strength through rapid checkoff trials on the phone.

Items 3–5 are suggestions, not approved product requirements. Keep further ideas
connected to reducing cognitive friction rather than adding screen clutter.

## Decision discipline

Keep founder-confirmed requirements separate from proposals. Record meaningful
technical choices in [DECISIONS.md](docs/DECISIONS.md). Update this file as the
conversation develops; do not silently turn an experiment into a requirement.
