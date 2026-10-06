# Success goals and their timeline

Confirmed by the founder on 6 October 2026. Each habit evaluates its own dated
entries against an effective-dated goal and weekday schedule. The goal editor includes a timeline of earlier and scheduled goals. Changing a target today preserves earlier results; explicitly
editing an earlier version recalculates its period without replacing any values.

## Editing

Open **Goal** in Create/Edit habit or the Statistics tab. The sheet opens directly
to the condition, repeat days and **Apply from** date, with Close/Done always
visible. It uses the habit's draft name, icon, colour and start date during creation
and editing. Checkbox completion is shown as a fixed statement, rather than a
single-option button. Repeat days are directly selectable; Every day and Weekdays
are shortcuts. The optional **Try a value** panel uses a real labelled checkbox
for checkbox habits and makes its local result distinct from recorded entries.

The default draft copies the rule effective Today and starts Today (or the habit's
start date during creation). A version starts on its effective date and ends the
day before the next version. Dates must be unique; applying another change on the
same effective date edits that slot. A new future goal retains the current version,
including a version that started Today. Opening an unchanged goal and pressing
Done closes it without creating a redundant version or History action.

**Goal timeline** opens a compact dated list within the same sheet. Back retains
all unsaved rule, schedule and date inputs. Choosing another goal or starting a
fresh draft asks before discarding actual unsaved changes. Timeline rows show
Current/Upcoming status, date ranges, conditions and repeat days without a second
copy of the current-goal card. Tap a dated row to edit that period explicitly.
Applying a change to an earlier period asks for confirmation. Removing a goal also
requires confirmation; the preceding goal extends into the gap. Before the first
explicit goal, Checked applies to checkboxes and Track only to the other types.
Recorded values and the raw log stay intact; History Undo/Redo reverses applied edits.

Numeric comparisons and text matching are grouped with their inputs. Category
exclusions are collapsed until needed, with selected exclusions summarized when
closed. Moving a category into Include or Exclude clears its opposite membership.
Specific draft validation explains missing targets, reversed ranges, empty day
sets, duplicate phrases and effective-date collisions. Storage still validates the
complete definition before accepting it. Decimal keyboard input accepts `.5` and
`,5`, while blanks remain different from zero.

Close or native swipe dismissal discards the current goal draft. Changes made
inside the habit editor remain staged until the enclosing habit editor's Done;
closing that editor discards them. From Statistics, Done applies an ordinary
undoable definition change. Save failures retain the shared visible Retry flow;
blocked saving disables application. Sheet motion remains native, with reduced-
motion-aware fades for the timeline and expanded condition controls.

## Rules

| Habit       | Available success conditions                                                         |
| ----------- | ------------------------------------------------------------------------------------ |
| Checkbox    | Checked                                                                              |
| Daily total | Track only; any recorded total; at least, at most, exactly, or an inclusive range    |
| Categories  | Track only; any selection; any/all chosen options; at least N selections; exclusions |
| Free text   | Track only; any nonblank text; contains any/all literal phrases                      |

Numeric targets accept nonnegative decimals. Explicit zero is a real value and
can meet a zero/range/upper-bound goal. An absent entry never meets a goal,
including “at most 0.” Clearing text or all categories leaves an absent entry.
Category rules use stable option IDs, so renaming or archiving an option retains
its historical meaning. Included/excluded sets cannot overlap. Exclusions reject
a day if any forbidden option is selected; they may be used alone with Any of.
An optional **Try a value** disclosure tests a draft without saving a daily record.

Text matching ignores case and repeated whitespace, uses literal substrings,
and supports up to twelve phrases. It does not interpret intentions or regular
expressions. Timelines are bounded to 128 versions per habit. Imports validate
the complete rule shape, IDs, date ordering, weekday set and relevant bounds.
Existing numeric/category/text habits remain Track only until explicitly edited;
no targets are inferred from previous entries.

## Schedules and statistics

Every day is the default; selected weekdays are supported. The schedule belongs
to each goal version, so later weekday changes leave earlier schedules intact.
Success rates divide successful scheduled days by applicable scheduled days since
the habit's own start, intersected with the chosen period. Today counts toward
that denominator; future dates, pre-start dates and Track only periods do not.
Blank applicable days are unsuccessful. Off-day entries remain editable and saved
but contribute neither success nor failure to the rate or success streak.

Success streaks count consecutive successful opportunities, bridging off-days.
An unfinished Today has the existing grace period; a missed earlier scheduled
day breaks the streak. Current/longest streaks use all history. Archive affects
list visibility, not eligibility. Numeric averages still divide by **all calendar
days** since the start. Category frequencies and recording counts/logging streaks
stay separate from success, retaining the meaning of existing record statistics.

Grid and calendar values remain readable. Meeting a goal adds a subtle row-colour tint for all four types; accessible labels announce value, success and scheduling.
Hide completed today uses the dated rule for all types, including numeric zero
when it meets an explicit rule. Meeting a goal on an off-day can hide that row,
although the extra entry does not affect success statistics. Show completed and
full rows when browsing other dates remain available. Numeric daily charts add
dashed per-day target marks, including both bounds for a range; raw totals remain.

## Storage and ownership

`Habit.goals` is an optional sorted timeline in version-11 habit definitions.
`habitGoals.ts` validates and evaluates rules; `habitCompletion.ts` supplies the
shared filtering predicate; `completionStatistics.ts` calculates scheduled-day
counts by bounded policy intervals rather than allocating lifetime calendars.
`HabitGoalsEditor.tsx` owns the native sheet, timeline and draft navigation;
`GoalVersionForm.tsx` owns grouped condition/schedule inputs and local tests.
`goalEditing.ts` supplies draft parsing and specific validation messages.
`GoalSummary.tsx` is the shared compact entry point. SQL stays at schema 1. Goals were introduced in v11; current writes/exports use v12 alongside the
archived-habit deletion work. Unchanged v1–v11 log prefixes retain their original interpretation. The
[v11 example](examples/storage-v11.json) extends the exact v10 prefix with a goal
change, Undo and Redo. No initialization, reseeding or automatic data migration
adds real goals. Sample Read/Water/Workout/Highlight goals exist only in the
isolated development sample log.

`scripts/habit-goals.test.mjs` covers rules, zero/blanks, dated changes, weekdays,
streak grace, retained numeric averages, validation, SQLite reload/Undo/Redo,
backup/restore, legacy prefixes and completion-mask notification filtering.
Physical iPhone checks remain necessary for nested sheets, keyboard/date-picker
comfort, VoiceOver and actual gesture/performance behaviour. Weekly quotas,
skipping/excused days, manual success overrides and comments remain deferred.
