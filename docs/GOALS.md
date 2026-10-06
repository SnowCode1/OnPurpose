# Success goals, periods and cycles

Founder-confirmed, 6 October 2026: separate what makes a day successful from how
often it should happen. Keep effective-dated rules, fixed weekly/custom periods,
and date-anchored on/off cycles. Remove the test-value panel. Create/Edit habit
and Goal use full-screen editors with fixed actions and short Back labels, rather
than a breadcrumb trail or wizard.

## Editing

Open **Goal** from Create/Edit habit or Statistics. The overview shows **Counts
when**, **Repeat**, **Cycle**, and **Applies from**, with current values visible.
One section opens at a time; single-choice fields reveal a short selection list
on tap instead of displaying every alternative as a button. Daily number inputs
and category multi-selection remain direct inside the open section. Checkbox
conditions are fixed text, not a redundant edit action. Section contents stay
mounted and hidden from accessibility while closed, preserving unfinished inputs
and custom-cycle choices across navigation. The form contains:

- **Counts when:** Checked, a numeric comparison, category condition, text condition,
  or Track only for non-checkbox habits.
- **How often:** Every day, Selected days, or Per period. Per period supports
  At least, At most, or Between successful days in a week or 1–366-day interval.
- **On/off cycle:** optional, with 5 days on/2 off, 3 weeks on/1 off and alternating
  weeks presets, plus custom 1–366-day or 1–52-week on/off lengths. The anchor is
  the first day of an on block; a week means seven days from that saved anchor.
- **Apply from:** effective date. The compact live summary replaces Try a value.

A completion is a **successful day**, not a tap, session, or selected category.
Several categories still give at most one successful day. A period target requires
a daily condition; Track only cannot silently acquire a quota. Per-period goals
use all weekdays; cycles may restrict which of those dates are applicable. Daily
schedules can combine chosen weekdays with an on/off cycle.

Cycle uses one Pattern selector, including None, the presets and Custom; Custom
reveals unit/on/off inputs. The anchor appears only inside the open Cycle section.
Full-screen editors scroll when needed, retain font scaling and safe areas, and
keep Close/Done visible above the keyboard. Goal's Back label names the enclosing
habit editor. Goal timeline is a separate view in the same editor; Back retains
all unapplied fields. Choosing another version asks before discarding a dirty draft.

Done inside a habit editor only stages the goal. The enclosing habit's Done saves
one undoable definition edit; Close discards the draft. Goal opened directly from
Statistics saves directly. Closing an unchanged goal writes no version/event.
Earlier corrections/removals require confirmation and are undoable. Dates are unique;
a new draft on an existing effective date updates that slot, while moving the date
creates a new version. Explicit timeline edits retain the selected version ID.

## Calendar boundaries

Weeks use the current Monday/Sunday preference **when created**, storing an anchor
in the goal. Changing the app preference never realigns saved periods. Custom day
periods are consecutive fixed intervals from their saved anchor, not rolling windows.
Cycles also keep their original anchor across later target changes unless edited.

New changes to an existing period goal default to the next period boundary (Today
if already on it). A newly enabled period also suggests that boundary. **New period
today** starts a fresh fixed-day interval immediately; for a weekly rule it becomes
a seven-day interval, explicitly preserving the new anchor rather than pretending
it is still a calendar week. Creation starts at the habit's start date.

A fragment cut by the habit start, effective-date change, or backdated correction
is **partial and unscored**. Its entries are retained, with no automatic prorating.
A full period remains open through its last day and is finalized the next local day.
Future entries do not count toward current progress. Entirely off periods are neutral.

## Daily conditions

| Habit      | Conditions                                                                       |
| ---------- | -------------------------------------------------------------------------------- |
| Checkbox   | Checked                                                                          |
| Number     | Track only; any recorded total; at least, at most, exactly, inclusive range      |
| Categories | Track only; any selection; any/all chosen IDs; at least N selections; exclusions |
| Text       | Track only; nonblank text; any/all literal phrases                               |

A blank daily entry never meets its condition, including a numeric at-most-zero
condition. Explicit numeric zero remains a real value. Category rules retain stable
IDs through renaming/archiving; Include and Exclude cannot overlap. Text matching
ignores case/repeated whitespace and supports up to twelve literal phrases.

Period upper bounds are deliberately different: **at most zero successful days**
can succeed with no successful days. At-least quotas require at least one; Between
can start at zero. Targets are whole days bounded by the period length. Validation
rejects unknown fields, invalid anchors, malformed cycles, incompatible daily rules,
and timelines over 128 versions. Existing real habits receive no inferred targets.

## Statistics and grid

Daily conditions still control cell tint and Hide completed today. Reaching a weekly
quota never hides a row for the rest of the week. Off-day entries stay editable;
they may tint/hide the row for Today but are neutral in success statistics.

Statistics adds compact current-period progress and an expandable list of recent
period results. Open upper-bound/range goals say “Within limit so far”; they are
not final successes. Finished-period totals use complete periods wholly inside the
selected range. Current/longest period streaks count successful complete periods,
bridge rest periods, and ignore partial fragments; they are labelled as all-time.
Daily success streaks are hidden while a period goal is active. Raw daily charts,
recording totals and logging streaks retain their distinct meanings. Numeric
averages still divide by every calendar day since the habit's start.

Daily opportunities use arithmetic over at most seven cycle blocks, never an
allocated lifetime calendar. Period statistics aggregate recorded dates by window
and count empty/rest windows through a bounded repeating schedule, so long blank
histories do not require one object per day or period. Up to eight recent results
are materialized for the UI. No period calculations enter per-cell subscriptions.

## Storage and ownership

Goals were introduced in v11. Version 13 adds optional `period` and `cycle` objects
to each goal; v1–v12 reject those fields and retain their original semantics.
Current writes/exports use v13, accepting unchanged v1–v12 prefixes. SQL stays at
schema 1. All timing changes remain ordinary append-only, atomic, undoable habit
edits. No reseeding, default-goal migration or entry rewriting occurs.

- `habitGoals.ts`: daily rules, timeline validation and lookup.
- `goalTiming.ts`: strict timing shapes, anchored dates and bounded schedule math.
- `completionStatistics.ts`: daily scheduled opportunities and streaks.
- `periodStatistics.ts`: fixed-window progress, results and period streaks.
- `PeriodProgress.tsx`: compact progress and recent results.
- `GoalVersionForm.tsx` / `GoalTimingFields.tsx`: staged rule/timing inputs.
- `GoalEditorControls.tsx`: compact overview sections and selected-value controls.
- `HabitGoalsEditor.tsx`: full-screen form/timeline and confirmation flow.
- `goalEditing.ts`: draft parsing and clear validation errors.
- `GoalSummary.tsx`: shared entry point; `habitCompletion.ts`: daily filtering.

The v13 fixture extends the exact v12 prefix with a period/cycle edit and Undo/Redo.
Sample Walk (5/2), Meditate (3 weeks/1 off), and Workout (weekly range on alternating
weeks) are appended only to the isolated development log in `sampleTiming.ts`.

Rolling windows, multiple completions within a day, summed numeric period quotas,
excused/skipped days, manual success overrides and comments remain deferred.
