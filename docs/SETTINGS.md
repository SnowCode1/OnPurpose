# Settings

Implemented 4 October 2026. The founder requested row and column spacing and
asked for a couple of genuinely useful additional settings. Week start and date
fading are the assistant's choices within that scope, awaiting phone review.

| Control              | Default  | Purpose                                                                                                                                                           |
| -------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Text size            | 100%     | One app-wide slider, 85–150% in 5% steps, with Reset to 100%. Includes descriptions and their editor.                                                             |
| Name column width    | Standard | Narrow / Standard / Wide at 80/100/120% of the adaptive name width, with text wrapping and full cell targets.                                                     |
| Row spacing          | Standard | Compact / Standard / Roomy minimum heights of 44 / 52 / 64 points. Larger text and measured content can grow.                                                     |
| Column spacing       | Standard | Target widths of 44 / 48 / 64 points before font scaling. Standard preserves the previous Compact layout. Fit whole days; the actual width fills available space. |
| Fade distant dates   | On       | Existing grid fading for empty older/future dates. Off gives every age the recent-day tone. Recorded values remain fully coloured in either mode.                 |
| Week starts on       | Monday   | Monday or Sunday ordering in the statistics calendar and weekday breakdown. Does not change recording dates, streaks or chart bucket totals.                      |
| Hide completed today | Off      | Filter rows meeting their dated success goal at Today, with Show completed for corrections.                                                                       |
| Haptic feedback      | On       | Enable or disable existing action feedback.                                                                                                                       |

Spacing shares geometry with date headings, cells, loading placeholders and
reordering. Column spacing preserves the name-column width and uses the existing
rotation/remount path to keep the viewed dates. Text scaling takes precedence over
fitting many days: when only one readable column fits, spacing options can converge.
At a 366-point grid width and normal text, the options show four, three and two days.

Date fading only changes the main grid's age emphasis, including its fallback
headings. It does not change habit colours, completed states, statistics colours or
stored records. The existing lower brightness bound for very dark colours remains.

These are global preferences, persisted by the same queue and atomic transactions
as habit changes. They are included in backup/restore and remain outside visible
History and Undo/Redo. Corrections can still group across a preference change, and
settings do not clear Redo. Sample-mode preferences are session-only in its isolated
store; use real data to test persistence.

Absent fields preserve previous behaviour without rewriting old logs. New writes and exports use v12; imports retain v1–v11 compatibility. Text size was introduced in v8.
The original display preferences were introduced in v6. Invalid settings or
new settings disguised as old events/habit actions are rejected. See STORAGE.md.
Settings continue to expose save failure/retry and disable edits when saving is
blocked or backup work owns the store.

Phone checks: compare density in both orientations and with larger text, then
scroll quickly, reveal future dates and return to Today. Compare fading at day 5–8
and in the future; checked cells and entered zero must remain prominent. Switch
week start and confirm dates line up with headings and retain their entries. Reload
real data, and verify preference changes neither appear in History nor consume Redo.

## App-wide text size

The founder requested a single setting throughout the app, rather than a separate
size for descriptions. App size multiplies the iPhone accessibility text size;
native system dialogs continue to use the system setting. Fixed decorative
checkmarks, emoji and vector icons keep their control geometry. Native text and
inputs share `Typography.tsx`; nested spans inherit the scaled parent without
double scaling. The DOM description editor receives the same combined scale.

The slider previews its percentage while dragging and saves once on release.
The Settings controls adopt the saved text size immediately; the grid holds its
display size until the sheet finishes dismissing. At larger sizes,
rows grow, fewer day columns fit, settings choices wrap and the statistics
calendar grows. Smaller text does not shrink touch targets below existing minima.
This shares the grid's existing geometry/scroll restoration path. Phone testing
remains necessary for keyboard, clipping and interaction comfort.

## Compact navigation and completed habits

The founder requested a calmer layout that can accommodate more settings.
`SettingsScreen.tsx` now owns an index with Appearance, Daily tracking, Archived
habits and Backups. Development tools, including sample data and preview sharing,
live behind one Development row and remain release-excluded. Each detail page
has Back to Settings and Close; compact grouped rows, switches and segmented
choices replace the long flat list. Save errors and Retry remain visible on every
settings page. Backup validation, confirmation and recovery are unchanged.

**Hide completed today** is off by default, preserving stable row positions. When
on, rows meeting their success goal hide while the grid is at Today. A Show completed count
below the rows reveals them for corrections and statistics; Hide completed
returns to filtering. Past/future browsing shows the full list. This temporary
reveal is not stored, and the next local day starts a fresh view.

`habitCompletion.ts` uses the effective-dated rule for each habit. Numeric,
category and text habits remain visible unless an explicit goal is met; a
record alone does not imply success. Explicit zero can meet an explicit numeric
rule. Entries, history and statistics are never deleted or filtered.
See [GOALS.md](GOALS.md) for off-day and goal-change semantics.

`completedHabitsSelection` subscribes to a primitive mask of today's completion
states only when filtering is enabled. Numeric edits notify the grid container only when crossing the goal threshold;
other dates and save acknowledgements leave the mask unchanged. Filtering does not add per-frame JS
scroll synchronization. Reordering displayed rows fills only their saved slots;
hidden and archived habits retain theirs. It persists a normal full order event
and remains undoable.

`hideCompleted` is a strict v9 boolean preference. Absent fields resolve to false.
It survives reload/backup/restore, remains outside History/Undo, preserves Redo
and does not interrupt correction grouping. Sample-mode changes stay isolated.
The Today-only scope, quick reveal and initial off state are assistant choices
within the request; the founder confirmed the layout and hide/reveal behaviour feel right on the phone.

After reviewing phone previews, the founder asked to remove remaining explanatory
blocks or hide them behind info buttons. `InfoNote.tsx` now provides labelled,
44-point accessible disclosure controls, collapsed by default, for Appearance,
Daily tracking and Backups. Save status/errors remain direct. Explanations expand
only on request and can collapse again; text scaling is preserved. This final
small disclosure change still needs device review.

## Responsive appearance changes

The founder reported slow spacing-option feedback. Row choices were relaying
geometry changes into the mounted hidden grid; column-width changes remounted
both native day lists for each choice. The width keys remain necessary to keep
header/body positioning aligned, but the hidden work now waits.

`useGridDisplayPreferences.ts` retains the displayed row/column spacing, text
size, fading and completion filtering while History/Settings/archive is open or
dismissing. The Settings highlight and normal durable write use current values
immediately. `AppPanel`'s native `onDismiss` releases only the latest values, so
rapid choices cause one final grid layout change. An inner TypographyProvider
keeps the hidden grid's font context stable while Settings scales. This is only
presentation deferral; preferences are still saved, backed up and excluded from
History/Undo as before. Closing by button or native swipe follows the same path.

The grid stays mounted, retaining date range, viewed day and scrolling state.
Necessary width-related list remounts occur after dismissal. Entry subscriptions,
save failure/retry and archive restores remain live. Native rotation/system text
changes are not frozen. Phone testing must confirm press responsiveness and a
correctly aligned return in both orientations and with larger text.

## Checkbox appearance

Appearance → Checkbox style offers **Checkboxes** (default) and **Ticks & crosses**.
Both scale with the same app/OS text size as the grid, with bounds from row and
column geometry. Shape still represents the dated On/Off state; success tint
continues to use the habit's goal. `checkboxStyle` persists as a v15 preference,
separate from habit History/Undo, and participates in deferred grid presentation.
Week start also waits for dismissal now that the grid draws a subtle week divider.
No separate rest-day setting or record type is introduced.

Appearance now includes **Week dividers** and **Tap animations**, both initially
On and saved separately from History/Undo (v16). Week divisions use faint alternating backgrounds confined to the date headings.
Their boundary follows Daily tracking → Week starts on. Turning them Off leaves
black headings, with Today still highlighted. The quiet header border is continuous
in either mode, preserving contrast for the future-pull streak. Habit cells are
unchanged. The fixed, quiet name/day separator stays visible independently.
Animation Off suppresses checkbox/mark pulses; it does not affect haptics or
navigation. Reduce Motion overrides the pulse even when its app toggle is On.
Both settings wait until dismissal before changing the mounted grid.

## Revised grid spacing and quick corrections (v17)

Appearance begins with Name column width, Column spacing and Row spacing,
followed by Text size. The three geometry controls retain app/OS font scaling.
Standard columns are the previous Compact, now the default. Compact is a denser
44-point minimum, Standard 48 and Roomy 64 (the previous Standard). Name widths
are 80/100/120% of the existing adaptive width, bounded by space for a readable
date column; longer names can grow row height.

New selections save `columnDensity` and `nameColumnWidth` as v17 preferences,
separate from History/Undo and preserving Redo. Old spacing events stay unchanged:
absent/old Compact displays Standard; old Standard/Roomy displays Roomy. The old
80-point option is superseded by the requested new Roomy density. Raw backup
records and old replay preconditions remain intact. Both controls join deferred
grid presentation and do not repeatedly rebuild the grid beneath Settings.

Hide completed today now waits for a 700 ms pause between newly qualifying taps,
then collapses rows. Undo/unchecking reveals immediately. A temporary Undo in the
fixed toolbar centre restores a specific entry or archive action for four seconds,
without hiding essential Today navigation or moving cells. Show completed remains
available. Filtering is applied behind Settings as soon as the switch changes,
so existing completed rows have gone on return. Presentation sizing still waits
for dismissal. Settings gains no timing toggles.

Temporary Undo fades out over 180 ms after its four-second lifetime. Hiding or
archiving a row eases remaining names and cells together over 220 ms. Restoring
rows through Undo uses the same shared positions. Both respect Reduce Motion;
rotation and font/spacing geometry changes remain immediate.
