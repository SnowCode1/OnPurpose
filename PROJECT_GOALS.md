# OnPurpose — project goals

Status: living product brief. Last updated: 4 October 2026.
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
  horizontally, with roughly three day columns depending on available space.
- Use [Loop Habit Tracker for Android](https://github.com/iSoron/uhabits) as a
  product reference. This is inspiration for behaviour, not a decision to copy
  its code, assets, scoring formula, or every feature.
- Support checkbox habits and numeric habits. Numeric entries are primarily a
  daily total, rather than repeated increments throughout the day.
- Let users arrange their own habit order. Completed habits stay in place.
- Design for muscle memory; the aspiration is opening the app and recording five
  checkbox habits in about three seconds.
- Plan for approximately 10–20 habits. The primary test phone is an iPhone 16 Pro.
- Tapping a habit should open its statistics, including information such as streaks.
- Store app changes incrementally. This is the underlying storage approach and
  export format, separate from the habit/day model; it also enables a separate
  history feature for browsing prior activity, checked boxes, and comments.
- Develop without owning a Mac; use the physical iPhone for actual testing.
- Maintain project goals, agent guidance including CLAUDE.md, and a docs folder.

## Proposed interaction rules

1. Launch directly into the current grid after initial setup.
2. Tap a checkbox date cell once to toggle it; show the result immediately.
3. Tap a numeric date cell to enter/edit that day's total.
4. Tap the habit name to open statistics. Names and date cells have distinct hit
   targets, so recording a value cannot accidentally open statistics.
5. Keep the current date in a predictable column. Today at the right is the
   starter experiment; final column direction and older-date navigation are open.
6. Change ordering only through deliberate editing, not automatic sorting.
7. Save locally and work offline; do not require an account for everyday tracking.
8. Use restrained feedback. Explore optional haptics, with no blocking celebration.
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

The architectural direction is confirmed. The event schema, correction/deletion
policy, export container, and exact history interface still need design.

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

The current starter is a disposable 12-row, three-day interaction demo. It has
checkbox toggles and a numeric-total editor. Statistics are explicitly a
placeholder. It does not save, implement the change log, or roll dates forward
while open. Those are subsequent implementation milestones.

## Deferred candidates, not permanent exclusions

Cloud sync, accounts, social features, leaderboards, coaching, AI features,
reminders, widgets, Apple Watch, and Android release support. Each needs a
concrete reason to enter the first release. Statistics, numeric habits, comments,
and incremental history are desired scope, not excluded candidates.

## Decisions to make together

| Question                                                               | Current status                                  |
| ---------------------------------------------------------------------- | ----------------------------------------------- |
| Which three dates, in which direction? How do we browse older dates?   | Today on the right in the demo; open            |
| All habits daily, selected weekdays, or frequency targets?             | Open                                            |
| Do numeric habits have units, targets, and a “lower is better” option? | Daily-total input confirmed; goal rules open    |
| What exactly counts toward a numeric or scheduled habit's streak?      | Open                                            |
| Midnight cutoff, late-night logging, backdating, and travel?           | Open; decide before persistence                 |
| Comments on a habit, a day, a particular entry, or multiple kinds?     | Comments desired; attachment semantics open     |
| Which app changes enter the history; how do deletion and undo work?    | Incremental storage confirmed; policy open      |
| Export/import format, backup location, and cross-device sync?          | Change-based export confirmed; details open     |
| Any reminders or widgets required for version one?                     | Open                                            |
| Free, paid, donations, or another model?                               | Open                                            |
| Licence and copyright holder?                                          | Open; choose before public release              |
| Final name and visual personality?                                     | Open                                            |
| iOS version, Expo account, Apple Developer membership?                 | iPhone 16 Pro confirmed; account/OS status open |

## Milestones

1. **Foundation:** local tooling, shared goals, phone setup guide, disposable grid.
2. **Interaction validation:** actual phone testing and agreement on core behaviour.
3. **Usable local app:** incremental storage, export/restore, management, dated entries.
4. **History and insight:** statistics, comments, and browsing previous changes.
5. **Beta:** own builds, TestFlight, accessibility, reliability, timed usability trials.
6. **Open-source and App Store release:** licence, public repo, final assets,
   accurate privacy details, App Review, publication.

## Decision discipline

Keep founder-confirmed requirements separate from proposals. Record meaningful
technical choices in [DECISIONS.md](docs/DECISIONS.md). Update this file as the
conversation develops; do not silently turn an experiment into a requirement.
