# Habit statistics

Implemented 4 October 2026. The founder requested full-screen statistics with
streaks, success-rate charts, and numeric charts. The calculations below are
implementation choices for the current daily habit model, awaiting phone feedback.
They do not establish frequency targets, scheduled weekdays, or numeric goals.

## Screen

Tap a habit name to open a full-screen view. The mounted grid keeps its date and
scroll position under it. Back returns to the grid; Edit opens the existing draft
editor above statistics. Changes update the statistics without recording new
statistics events. The header and habit title retain the guarded development
preview gesture.

Choose 30 days, 90 days, one year (365 days), or All. Ranges include today. Checkbox
cards show completion rate, current streak, all-time best streak, completions,
and tracking-day count. An equal-length previous-period comparison is shown when
both periods have a denominator. Numeric cards show total, average, highest daily
total, logging streak, and recorded-day count.

Charts show checkbox completion percentages or numeric totals. Numeric 30-day
charts use daily bars; longer ranges aggregate into labelled multi-day buckets.
Checkbox charts use up to seven days per bar for shorter ranges, with wider
buckets for long histories. Partial last buckets are labelled with their actual
bounds. Tap the chart to inspect a bucket; VoiceOver increment/decrement actions
provide the same information. Weekday breakdowns use the selected range.

The calendar browses months independently of the range. Coloured checkbox days
are completed; numeric colour intensity scales against that month's highest
recorded total. Zero remains coloured, blanks remain empty, future dates are dim.
Today has an outline. Each day has a spoken date and value.

## Calculation rules

- Read current values from the replayed projection, not a count of raw edit events.
  Corrections and Undo therefore affect a day only through its final current value.
- Future-dated values contribute to neither charts nor streaks until their day arrives.
- Creation comes from initialization or the first saved definition. Use the event's
  captured UTC offset to identify its local edit day. Earlier dated entries extend
  the tracking start to their earliest date, including intervening days.
- Checkbox denominator: elapsed tracking days through yesterday, plus today only
  once completed. The numerator is the number of checked days in the range.
  A just-created, unfinished habit has no rate, shown as a dash, rather than 0%.
- Archive ends an active interval before its local archive day; restore starts an
  interval on its local restore day. Unrecorded paused days are excluded. Explicit
  records in a paused interval still count in both numerator and denominator.
  Definition events from Undo/Redo also form these intervals; they do not rewrite
  the times at which the habit was actually archived/restored. Sequence order wins
  over clock rollback; lifecycle boundaries cannot go backwards or overlap.
- Checkbox streaks count consecutive checked calendar dates. The current streak
  ends today if checked, otherwise yesterday, so an unfinished today has a grace
  period. A missing earlier day breaks the streak. Archive does not bridge gaps.
- Numeric averages divide by recorded days, including zero; blank days are not
  silently treated as zero. Numeric streaks mean consecutive days **recorded**,
  not target achievement. No numeric success rate is invented.
- Current/best streaks use the entire history. Period totals, averages, rates,
  chart buckets, and weekday breakdowns use the selected range.
- Date arithmetic uses calendar-day ordinals rather than elapsed local hours,
  avoiding daylight-saving discontinuities. Weekday groups start on Monday.

## Ownership and verification

`src/statistics.ts` is pure derived logic. `src/HabitStatsScreen.tsx` owns the screen,
charts, and month/range selection. Nothing is stored separately; the existing
version-1/2/3/4 logs and projection remain authoritative.

`node --test scripts/statistics.test.mjs` covers denominators, unfinished today,
streaks, zero versus blank, future exclusion, archive/restore including Undo/Redo,
backdating, timezone offsets, DST dates, leap years, weekday/bucket partitioning,
previous periods, clock rollback, and unchanged legacy backup fixtures.
Native chart interaction, VoiceOver, larger text, landscape, and animation feel
remain device acceptance checks in [TESTING.md](TESTING.md).
