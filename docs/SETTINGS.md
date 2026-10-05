# Settings

Implemented 4 October 2026. The founder requested row and column spacing and
asked for a couple of genuinely useful additional settings. Week start and date
fading are the assistant's choices within that scope, awaiting phone review.

| Control            | Default  | Purpose                                                                                                                                                  |
| ------------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Text size          | 100%     | One app-wide slider, 85–150% in 5% steps, with Reset to 100%. Includes descriptions and their editor.                                                    |
| Row spacing        | Standard | Compact / Standard / Roomy minimum heights of 44 / 52 / 64 points. Larger text and measured content can grow.                                            |
| Column spacing     | Compact  | Target widths of 48 / 64 / 80 points before font scaling. Compact preserves the previous layout. Fit whole days; the actual width fills available space. |
| Fade distant dates | On       | Existing grid fading for empty older/future dates. Off gives every age the recent-day tone. Recorded values remain fully coloured in either mode.        |
| Week starts on     | Monday   | Monday or Sunday ordering in the statistics calendar and weekday breakdown. Does not change recording dates, streaks or chart bucket totals.             |
| Haptic feedback    | On       | Enable or disable existing action feedback.                                                                                                              |

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

Absent fields preserve previous behaviour without rewriting old logs. Text size uses v8 events and exports; imports retain v1–v7 compatibility.
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

The slider previews its percentage while dragging and applies once on release,
so the grid does not repeatedly remount under a moving thumb. At larger sizes,
rows grow, fewer day columns fit, settings choices wrap and the statistics
calendar grows. Smaller text does not shrink touch targets below existing minima.
This shares the grid's existing geometry/scroll restoration path. Phone testing
remains necessary for keyboard, clipping and interaction comfort.
