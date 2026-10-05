# Habit statistics

Implemented 4 October 2026. The founder requested full-screen statistics with
streaks, success-rate charts, and numeric charts. The calculations below are
implementation choices for the current daily habit model, awaiting phone feedback.
They do not establish frequency targets, scheduled weekdays, or numeric goals.

## Screen

Tap a habit name to open a full-screen view. The mounted grid keeps its date and
scroll position under it. Back returns to the grid; an intentional downward pull
released at least 76 points beyond the top also dismisses. Only a drag beginning
at the top qualifies; returning from deeper content or momentum cannot dismiss.
The screen follows the pull slightly and slides down in 180 ms, or settles back
for a short/cancelled pull. Reverse motion cancels. Animation stays on the UI
thread and honours Reduce Motion. The Back button remains available.
Edit opens the existing draft
editor above statistics. Changes update the statistics without recording new
statistics events. The header and habit title retain the guarded development
preview gesture.

Optional habit descriptions appear first in a compact rounded note card,
before the range controls and charts,
with a bounded Markdown preview, Read more/Show less and direct full-screen editing.
Links open only when tapped. See [DESCRIPTIONS.md](DESCRIPTIONS.md). These notes do
not change statistical calculations.

Choose 30 days, 90 days, one year (365 days), or All. Ranges include today. Checkbox
cards show completion rate, current streak, all-time best streak, completions,
and calendar-day count. An equal-length previous-period comparison is shown when
both periods have a denominator. Numeric cards show total, average, highest daily
total, logging streak, and recorded-day count. Numeric averages are labelled
Average / calendar day.

Charts show checkbox completion percentages or numeric totals. Numeric 30-day
charts use daily bars; longer ranges aggregate into labelled multi-day buckets.
Checkbox charts use up to seven days per bar for shorter ranges, with wider
buckets for long histories. Partial last buckets are labelled with their actual
bounds. Tap a bar/period to inspect it; tap it again or use Clear to deselect it.
VoiceOver provides previous/next period and Clear selection actions. Keep the
detail area and Clear space reserved to avoid shifting the screen on selection.
Selection uses the bucket's date bounds, not its array index; if an older edit
changes those bounds, the chart stops highlighting rather than inspecting another
period. Changing range or rolling into a new day resets selection. The vertical
value scale is separate from the date labels, which include years across year
boundaries. Weekday breakdowns use the selected range and show numeric units.

The calendar browses months independently of the range. Coloured checkbox days
are completed; numeric colour intensity scales against that month's highest
recorded total. Zero remains coloured, blanks remain empty, future dates are dim.
Day cells have no selection/Today border, as requested by the founder. Today
remains identified in its accessibility label. Dim numeric backgrounds separately
from text and choose text contrast against the actual background, so small totals
and zero retain readable dates. Each day has a spoken date and value.

Tap any calendar day to toggle a checkbox or open the grid's daily-total editor.
The exact selected date is passed to the same entry handler, including future days
visible in the current month. Future records are shown in the calendar but remain
excluded from statistical calculations. Edits immediately update charts and grid
values and use normal saving, haptics, grouped History, and Undo/Redo. Numeric zero,
blank-to-clear, and Cancel retain their grid meanings. Save failures disable edits
and expose the existing retry banner. Calendar checkboxes expose their checked state
to VoiceOver; numeric days announce the full date and recorded value.

## Calculation rules

- Read current values from the replayed projection, not a count of raw edit events.
  Corrections and Undo therefore affect a day only through its final current value.
- Future-dated values contribute to neither charts nor streaks until their day arrives.
- For legacy habits without an explicit start date, creation comes from initialization or the first saved definition. Use the event's
  captured UTC offset to identify its local edit day. Earlier dated entries extend
  the tracking start to their earliest date, including intervening days.
- Explicit start dates replace that inferred lower bound. Backdating includes empty
  elapsed days before app creation without needing a fabricated first entry.
  Moving the start forward excludes older records from all metrics, charts,
  comparisons and streaks, but never deletes values or events. Moving it back
  includes them again. Future start dates show “Starts”
  and no eligible records until that date. Calendar/grid entries remain editable;
  entries before the start date stay saved, outside statistics. This is an
  implementation rule; the continuous calendar denominator is founder-confirmed.
- Founder-confirmed denominator: every calendar day from the habit's own start
  through today, intersected with the selected range. Activity in other habits
  never changes its start or denominator. Checkbox rates divide checked days by
  those calendar days. An unfinished today counts as a calendar day; a new habit
  starting today therefore shows 0% until checked. Days before the start and future
  days have no denominator. This supersedes the old unfinished-today grace for rates.
- Archive controls list visibility; it does not pause the calendar denominator.
  Restoring, Undo/Redo or timestamp rollback in archive edits cannot change the
  period. Saved entries remain intact. This follows the continuous start-to-today
  rule and supersedes the earlier archive-pause implementation.
- Checkbox streaks count consecutive checked calendar dates. The current streak
  ends today if checked, otherwise yesterday, so an unfinished today has a grace
  period. A missing earlier day breaks the streak. Archive does not bridge gaps.
- Founder-confirmed numeric averages divide the total by all calendar days in the
  period since the start, including blank days and today. For example, 30 minutes
  across four days averages 7.5 minutes/day even with only three records. Blanks
  stay blank in storage and daily charts; an explicit zero remains a recorded day.
  A period with calendar days but no records averages zero; a period before the
  start has no average. Numeric streaks mean consecutive days **recorded**,
  not target achievement. No numeric success rate is invented.
- Current/best streaks use the entire history. Period totals, averages, rates,
  chart buckets, and weekday breakdowns use the selected range.
- Date arithmetic uses calendar-day ordinals rather than elapsed local hours,
  avoiding daylight-saving discontinuities. Weekday groups and calendar headings follow Settings → Week starts on
  (Monday by default, optionally Sunday). This changes presentation order only;
  recording dates, statistics totals and chart buckets remain the same.

## Ownership and verification

`src/statistics.ts` is pure derived logic. `src/HabitStatsScreen.tsx` owns the screen,
charts, and month/range selection. Nothing is stored separately; the existing
version-1/2/3/4/5/6/7 logs and projection remain authoritative.

`node --max-old-space-size=256 --test --test-timeout=15000 scripts/statistics.test.mjs`
covers per-habit calendar denominators, unfinished today,
streaks, zero versus blank, future exclusion, archive/restore including Undo/Redo,
backdating, timezone offsets, DST dates, leap years, weekday/bucket partitioning,
previous periods, independence from other habits, clock rollback, and unchanged
legacy backup fixtures.
Native chart interaction, VoiceOver, larger text, landscape, and animation feel
remain device acceptance checks in [TESTING.md](TESTING.md).

## Reviewing with fictional history

Development Settings → Sample data supplies 180 days for every preset without
mixing with real entries. Read has increasing minutes; Drink water has decimal
values, zeros, and missing days. Go for a walk has a recent uninterrupted streak;
Meditate has a recent gap. Stretch/Learn trend upward, while Write a little trends
downward; outdoor/cooking/contact habits vary by weekday. Today is partly recorded,
and no future sample entries are generated. These are synthetic UI test scenarios,
not proposed habit targets or product scoring rules.

Test 30-day/90-day/year/all ranges, bucket inspection, weekday bars, and calendar
months. Settings can reset the sample or return to real data. Sample edits are
session-only; see DEVELOPMENT.md for the startup env switch.
