# Habit statistics

Implemented 4 October 2026. The founder requested full-screen statistics with
streaks, success-rate charts, and numeric charts. The calculations below are
implementation choices for the current daily habit model, awaiting phone feedback.
Effective-dated success conditions and weekday schedules are now supported; see
[GOALS.md](GOALS.md). Weekly frequency quotas remain deferred.

## Screen

Tap a habit name to open a large native iOS page sheet, matching History and
Settings. The founder requested bottom-up entry and easier downward dismissal.
This supersedes the sideways full-screen transition and custom 76-point
overscroll gate. UIKit owns the slide and interactive swipe dismissal; the
content is an ordinary native ScrollView. Pull down from the header or the top
of the content, or use the accessible Close button. From deeper content, scroll
back to the top first. The founder confirmed the revised sheet looks good on the iPhone. Detailed
short/reversed drag, nested-editor and Reduce Motion checks remain in TESTING.md.

The mounted grid keeps its viewed dates and scroll position beneath the sheet.
`App.tsx` hosts statistics and its numeric/habit/description/version dialogs within
the same presentation tree so nested editors present above it. Save failure/retry
is also visible inside the statistics sheet. Edits update derived statistics
without introducing separate statistics events. Development preview capture is
now globally available through face-down-and-back; title holds remain optional.

Optional habit descriptions appear first in a compact rounded note card,
before the range controls and charts,
with a bounded Markdown preview, Read more/Show less and direct full-screen editing.
Links open only when tapped. See [DESCRIPTIONS.md](DESCRIPTIONS.md). These notes do
not change statistical calculations.

Choose 30 days, 90 days, one year (365 days), or All time. Ranges include today.
The founder requested a more natural layout instead of a large marketing-style
completion percentage and repeated cards. A plain summary now leads: for example,
“20 of 30 days checked,” followed by a quieter percentage and actual date range.
Compact label/value rows show current and all-time longest streaks. Numeric habits
lead with their recorded total and show average per calendar day, highest daily
total, recorded-day count and recording streaks. The previous-period KPI is no
longer displayed; its pure calculation remains available. Notes remain first.
The founder confirmed this presentation looks better on the phone; the
calendar-day denominators and all calculations are unchanged.

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

## Layout revision (10 October 2026)

The founder found the screen cluttered, especially the goal card at the top, and
asked for chart explanations to move behind an information control because the
screen is visited daily. Assistant implementation, reviewed on the Android
phone; iPhone review pending. It supersedes the ordering and caption details
above; calculations are unchanged.

- Order: range tabs, period dates, one large headline with a short note, a
  two-column grid of number tiles, a slim goal row, period progress, then the
  charts, time of day, calendar and How statistics work.
- Tiles keep an even grid: when the count would be odd, current and longest
  streak share one tile. The goal row (`GoalSummary compact`) keeps the same
  editor entry point; the habit editor keeps the full card.
- Every chart section has a title and an (i) button that expands its
  explanation; nothing explanatory is shown by default. Live one-line facts,
  such as Most often 9 pm–10 pm, stay visible.
- Charts no longer show a unit line above or Tap a bar hints below. One reserved
  line under each chart names what the bars measure and becomes the selected
  bar's date and value, with an X icon to clear it, so selection never shifts
  the screen.
- `src/StatsLayout.tsx` owns the shared range tabs, sections, tiles and month
  arrows used by both statistics screens. Period progress is a compact card.
- Header Close and Edit are icons (X and pencil) in Notes and Statistics, and
  header Close is an X in the other full-screen editors and sheets. Paired
  bottom actions (Close/Done in the numeric dialog) and back links keep text.

## Charts (10 October 2026)

Founder decisions: merge the numeric value and completion charts by colour;
add success over time as weekly columns with a weighted trend line; give
categories their own colour-coded view; make every chart and the calendar follow
the selected range; ranges stay "ending today" with ‹ › to step back; the year
calendar shows 12 small months; category colours are automatic OKLCH; entries
stay at the bottom. Assistant implementation, reviewed on the Android phone with
sample data; iPhone review pending. These supersede the chart, calendar and
month-arrow details in Screen above; calculation rules below are unchanged.

- **Windows.** `statsWindow` gives the range ending today, stepped back by whole
  ranges; ‹ is disabled once the window reaches the habit's start. Charts and the
  calendar begin at the start when the window reaches further back. Headline,
  tiles, weekday and time-of-day figures follow the window; current/longest
  streak tiles and current period progress still describe today.
- **One colour language** (`outcomeColours.ts`): met = habit colour; scheduled
  but missed = the same hue faded; not scheduled/rest = neutral grey; combined
  weeks/months step brightness by the share of scheduled days met. The calendar
  tints missed days faintly, keeps days off black and today neutral until done.
- **Daily totals** (number habits): one bar per day up to ~3 months, coloured by
  that day's goal outcome, with the effective goal as one continuous dashed line
  (a band for "between"). Longer windows show the average per calendar day of
  each week (year) or month (all time) so bars compare with the daily goal.
- **Success over time:** faint columns are each week's (month's) share of
  scheduled days met; the line is a centred Gaussian smoothing of the success
  observations (sigma 7 calendar days, so about two weeks either side carry the
  weight). The founder found the first, one-sided weighted average jagged; the
  centred curve has no daily kinks, and at today only earlier days exist. It
  uses the whole history (the value at a date never changes with the range),
  skips days off, counts today only once it succeeds, and appears once about
  two observations are nearby. Period goals smooth finished whole periods over
  two periods; habits without a goal show days recorded.
- **Streaks:** the founder found the first, climbing-line streak chart broke
  down for long streaks. Now a timeline: each bar spans the calendar days a
  streak lasted and gaps are breaks, so 5-day and 500-day streaks read alike;
  the ongoing streak is brightest, a streak that began before the window fades
  in from the left, and bars wide enough show their length. Below it, the best
  three streaks of all time with dates. Runs are carried across days off and
  rest periods, an unfinished today keeps the streak, and period goals count
  periods; the longest run equals the longest-streak tile and the ongoing run
  the current streak (tested).
- **Calendar:** up to ~3 months, continuous rows of weeks (values inside number
  days, category dots, a dot for text); successful days in a row join into one
  bar, bridged across days off within the row; tapping edits as before. Longer
  windows show compact months (3 per row; 4 beyond a year); tapping selects a
  day and shows its reading with an Edit button.
- **Categories:** one row per category in saved order with automatic OKLCH
  colours (golden-angle hue steps from the habit colour, fixed lightness), as a
  timeline (days, or weeks/months shaded by how often) or by weekday. Rows never
  stack, because several categories can share a day. Tapping a row filters the
  calendar dots and the entries list; tapping again or the chip clears it.
- **Entries:** a month-grouped journal, newest first: day number and weekday,
  category chips or text, goal status when an entry can miss its goal, and the
  entry time when it was made that day.
- **Interaction:** every chart uses `ChartFrame`: tap a bar, step with ‹ ›,
  clear with ✕; VoiceOver adjusts by slot. Selection follows a date key, so
  data changes never move it to another period. Press-and-drag scrubbing is
  deferred: it needs a scroll lock between the pager, the sheet and the chart.

`scripts/stats-series.test.mjs` checks day outcomes against `evaluateGoal` for
every sample habit and day, streak lines against the streak tiles, period
observations against period results, the trend weighting, bins, windows, axis
helpers and category colours.

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
  never changes its start or denominator. Checkbox rates divide checked scheduled days by
  applicable scheduled days; the default remains every day. An unfinished today counts as a calendar day; a new habit
  starting today therefore shows 0% until checked. Days before the start and future
  days have no denominator. This supersedes the old unfinished-today grace for rates.
- Archive controls list visibility; it does not pause the calendar denominator.
  Restoring, Undo/Redo or timestamp rollback in archive edits cannot change the
  period. Saved entries remain intact. This follows the continuous start-to-today
  rule and supersedes the earlier archive-pause implementation.
- Checkbox streaks count consecutive successful scheduled dates; off-days are neutral. The current streak
  ends today if checked, otherwise yesterday, so an unfinished today has a grace
  period. A missing earlier day breaks the streak. Archive does not bridge gaps.
- Founder-confirmed numeric averages divide the total by all calendar days in the
  period since the start, including blank days and today. For example, 30 minutes
  across four days averages 7.5 minutes/day even with only three records. Blanks
  stay blank in storage and daily charts; an explicit zero remains a recorded day.
  A period with calendar days but no records averages zero; a period before the
  start has no average. Without an explicit goal, numeric streaks mean consecutive days **recorded**.
  Explicit goals add a separate scheduled-day success rate and success streak.
- Current/best streaks use the entire history. Period totals, averages, rates,
  chart buckets, and weekday breakdowns use the selected range.
- Date arithmetic uses calendar-day ordinals rather than elapsed local hours,
  avoiding daylight-saving discontinuities. Weekday groups and calendar headings follow Settings → Week starts on
  (Monday by default, optionally Sunday). This changes presentation order only;
  recording dates, statistics totals and chart buckets remain the same.

## Ownership and verification

`src/statistics.ts` is pure derived logic. `src/HabitDetailsScreen.tsx` owns the Notes/Statistics tab trial and common header.
`src/HabitStatsScreen.tsx` owns Statistics content, charts and month/range selection.
Habits with notes open the full reader directly, others open Statistics. The
floating bottom Notes/Statistics island and horizontal swipes share native
paging through `useHabitPages.ts`. Panels retain their scroll/range/chart state;
measured island height keeps final chart/calendar/info controls reachable. The
outer page sheet still enters upward and dismisses downward through UIKit.
Nothing is stored separately; the existing version-1–12 logs and projection remain authoritative.

`node --max-old-space-size=256 --test --test-timeout=15000 scripts/statistics.test.mjs`
covers per-habit calendar denominators, unfinished today,
streaks, zero versus blank, future exclusion, archive/restore including Undo/Redo,
backdating, timezone offsets, DST dates, leap years, weekday/bucket partitioning,
previous periods, independence from other habits, clock rollback, and unchanged
legacy backup fixtures.
Native chart interaction, VoiceOver, larger text, landscape, and animation feel
remain device acceptance checks in [TESTING.md](TESTING.md).

## Reviewing with fictional history

Settings → Development → Sample data supplies 180 days for every preset without
mixing with real entries. Read has increasing minutes; Drink water has decimal
values, zeros, and missing days. Go for a walk has a recent uninterrupted streak;
Meditate has a recent gap. Stretch/Learn trend upward, while Write a little trends
downward; outdoor/cooking/contact habits vary by weekday. Today is partly recorded,
and no future sample entries are generated. These are synthetic UI test scenarios,
not proposed habit targets or product scoring rules.

Test 30-day/90-day/year/all ranges, bucket inspection, weekday bars, and calendar
months. Settings can reset the sample or return to real data. Sample edits are
session-only; see DEVELOPMENT.md for the startup env switch.

The founder subsequently requested less explanatory copy. Calendar guidance and
calculation details now use collapsed labelled info disclosures. Daily bars no
longer repeat “One bar per day”; aggregation bounds remain visible for multi-day
bars. This preserves necessary chart units and period context. New disclosure
interaction remains a device check.

Range controls measure their available width and wrap into two rows when four
labels cannot fit at the combined app/system text scale. Normal-size portrait
and wide landscape keep one row. Metric values can wrap rather than pushing
labels out of the screen. Web layouts were inspected at 100% and 150%; native
large-text comfort remains a device check.

## Categorical and text recording statistics

`RecordStatsScreen.tsx` uses pure `recordStatistics.ts` and the shared trend
chart in recording mode. Both types show recorded days out of all eligible
calendar days since the habit start, logging streaks, recording-rate bars, an
editable month calendar and a virtualized dated entry list. These are recording
metrics; explicit goals add separate scheduled-day success counts/rates/streaks. Streaks
exclude pre-start/future entries and allow an unfinished Today as other types do.

Categories show days each stable option was selected, including archived options
when they have records. Counts are not mutually exclusive; selecting several on
a day counts that day for each option. Bars divide by all eligible calendar days
of the selected period. Text entries preserve full strings; list previews are
bounded to three lines and open the same daily editor as the grid. Corrections
update all derived views and use normal Undo/Redo. Month/range/scroll state stays
within the existing floating Notes/Statistics sheet. Sample mode adds Workout
and Daily highlight with sixty days of fictional records, isolated from real data.

## Effective-dated goals

Goal opens the condition/repeat/date form from Statistics, with its timeline one tap away. Each date uses its effective
rule/schedule, retaining historical results when a new goal starts Today. Success
charts and weekday rates use applicable-day denominators; Track only and off-days
contribute no failure. Today counts toward rates with the existing streak grace.
Numerical totals/averages and category frequency/recording metrics remain separate.
Numeric daily charts show dashed target marks for each scheduled day and both
bounds for range rules. Calendar/grid accessibility announces dated goal state.
Editing an earlier goal is explicit and undoable without replacing any entries.
See [GOALS.md](GOALS.md) for full semantics and tests.

## Fixed-period results and cycles

`goalTiming.ts` supplies anchored on/off eligibility to daily statistics. Off dates
are neutral; cycles may be in days or seven-day weeks. `periodStatistics.ts`
counts distinct dates meeting the daily condition into saved fixed windows.
`PeriodProgress.tsx` shows current progress plus expandable recent results. Open
periods, rest periods and boundary fragments are distinct from failed finished
periods. Only complete finished windows wholly in the selected range enter its
period totals. Period streaks are all-time; raw logging metrics stay separate.
Daily success streaks are hidden while a period goal is active. See GOALS.md.

## Time of day

Added 10 October 2026. Both statistics screens show a Time of day section after
the period charts: 24 hourly bars for the selected period, the most common hour,
and how many of the period's recorded days the chart covers. Tap a bar, or use
the VoiceOver adjustable actions, to inspect an hour. `src/timeOfDay.ts` owns the
pure calculation; `src/TimeOfDayChart.tsx` is the shared chart.

Founder decisions:

- Only entries recorded on the same local day they belong to count. Backdated
  entries stay in every other statistic but are left out of this chart; the
  caption says how many were left out.
- Undone changes never count, here or in any other statistic.

Assistant choices, accepted by the founder where noted:

- Times use the UTC offset captured with each edit, so an entry made while
  travelling keeps the local time where it was made (recommended and accepted).
- The time counted is when the entry last went from empty to recorded. Later
  corrections, such as raising a numeric total, keep that time; clearing and
  re-entering it later moves it. A correction group counts from its first edit.
- Checkbox Off (an explicit 0) is not a recorded entry; numeric zero, text and
  category selections are. Days that succeed only through a dated checkbox
  default have no tap and no time.
- The period is the selected range, bounded by the habit's start date.

The calculation reads the active History actions (`replay.undo`), which already
exclude undone groups and restore redone ones with their original time. No
event, preference, schema or backup format changes. Sample presets now record
deterministic typical times of day (for example Meditate around 6:45, Read
around 21:30), sorted within each day so History stays in time order. Sample
Workout/Daily highlight records are entered on a later day and show the empty
state. `scripts/time-of-day.test.mjs` covers offsets, backdating, Undo/Redo,
corrections, checkbox Off, numeric zero, period bounds and the sample shapes.
