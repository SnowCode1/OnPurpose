# Grid performance

Implemented 4 October 2026 after the founder reported slow check/uncheck feedback
and fast horizontal scrolling. These changes reduce identified work; device
smoothness still needs measurement on the iPhone 16 Pro.

## Entry updates

The root still subscribes to the store for dialogs, errors and save status.
Its active habit list and grid callbacks now retain their identities between
entry edits and save acknowledgements. HabitGrid receives the store, not the
entire values object. Its memo boundary can therefore skip those root updates.

GridCells owns memoized date columns, cells and headings. Each mounted cell
subscribes to its own primitive entry value through storage/selection.ts. A date
heading reads only the active habits for that date, including numeric zero.
Unrelated entries, preferences, and successful save acknowledgements do not notify
these selected subscribers. Notifications still derive from the authoritative
store snapshot; no second mutable values cache exists. Undo/Redo, restore, pending
edits and re-subscription read current values directly. Disabled state/error retry
continues through root props, so save failures still block further editing.

A mounted grid behind statistics updates the affected cell without rebuilding
all columns. Statistics is memoized against unchanged props for save-status
updates. Statistics calculations themselves still run when their data changes.

## Horizontal scrolling

- gridAppearance.ts precomputes five colour levels per habit. Grid rendering reads
  those levels instead of repeating OKLCH conversions/gamut searches per cell.
  Tests verify exact parity with the earlier formulas, including future cells.
- Each grid owns a local-date cache. Range expansion retains existing date objects
  and formats only newly added days with reused Intl formatters. It is discarded
  on grid unmount/local-day rollover; it grows with the already-loaded date range.
- Header/body requests at the same rendered history boundary share one extension
  to avoid adding two 90-day batches. Existing column geometry is reused; date
  columns and headings can skip unchanged React props when the month label changes.
- Native UI-thread header/body synchronization, Today animation, future reveal,
  reorder transforms, cancellation, and completed-drop persistence are preserved.
  No per-frame synchronization was moved to JavaScript, and no list dependency was
  introduced. Subsequent fast-fling feedback prompted the loading/batch changes below.

## Fast-fling loading structure

The founder confirmed checkbox improvements but still saw black gaps when native
scrolling outran React rendering. GridLoadingBackdrop now paints muted dashes per
row beneath the body list, using a viewport-width-plus-two-columns SVG pattern.
It has no entry subscriptions or press handlers. Its translation follows native
offset modulo column width on the UI thread; reorder geometry remains shared.
Two transform-only masks hide dashes beyond the real content on edge pulls.

A separate read-only date strip pre-renders labels for the loaded date range.
It translates with the same native offset and preserves date-key identity while
extending history. This costs lightweight text for the loaded range, not all
habit/day controls. Check native memory/render cost when browsing very long ranges.
Fallback content is hidden from VoiceOver, and real columns/headings paint opaque
backgrounds over it. A missing control is never tappable or presented as an unchecked
saved value. Fallback movement requires no JavaScript scroll synchronisation.

The installed `VirtualizedList`/`computeWindowedRenderLimits` already prioritises
the visible area then nearby overscan with direction bias. Keep that ordering,
reduce body batches from at least 12 dates to visibleDays + 1, and reduce ordinary
batch delay from 50 to 16 ms. Headings use an 11-viewport window and larger batches;
the body retains its 5-viewport window. Exact sizing remains a device experiment.
React Native documents this [batch-size/frequency tradeoff](https://reactnative.dev/docs/optimizing-flatlist-configuration).

## Development timing

Set `EXPO_PUBLIC_DEV_PERFORMANCE=true` in ignored `.env.local`, then fully reload
Expo Go. It is enabled locally for this pass; the example defaults false. Both
`__DEV__` and the env flag are required. Production builds never collect/log these
samples, even with the local flag enabled.

React Native DevTools receives one aggregate console report per active five-second
window, prefixed `[OnPurpose performance]`. It includes counts and average/max
milliseconds; it never includes habit names, entry values, dates or raw events.
No file is written and no diagnostics are uploaded. Turn the flag off and reload
for an uninstrumented comparison.

- `grid.container.render`, `grid.cell.render`, `grid.heading.render`: render attempt
  counts, including initial mounting and newly virtualized columns. Duration zero
  for these counters is intentional; use Profiler records for actual render cost.
- `grid.render`, `statistics.render`: React Profiler commit actualDuration. These
  measure React work, not native display latency or full frame time.
- `store.apply`: synchronous event validation/reduction.
- `store.metadata`: change ID, edit timestamp and local-zone metadata creation.
- `store.publish`: event-array publication and subscriber callbacks.
- `store.append`: repository append through save-acknowledgement publication,
  including time waiting for native storage (or the sample memory adapter).

To isolate a checkbox edit, allow initial mounting to settle and wait for the
initial aggregate, tap one cell without scrolling, then inspect the next report.
Expect one changed cell; its heading changes only when that day's recorded/empty
state changes. The grid container should not rerender just for that entry or its
successful save. Strict Mode/concurrent render attempts can increase counters.
Use the DevTools performance trace to inspect JS stalls and compare a release
build for final performance acceptance; Expo Go timing is not release evidence.

## Reproducible synthetic benchmark

`npm run benchmark:grid` compares the earlier colour/date preparation with the
new production helpers and exercises 40 edits with 480 selected subscribers at
six months and five years of synthetic 20-habit history. It never opens the real
database or writes user data. Results are CPU measurements in desktop Node,
not native iPhone frames, React renders, SQLite bridge time or disk durability.

Representative run on the development host, 4 October 2026:

| Work                                                  |    Median | 95th percentile |
| ----------------------------------------------------- | --------: | --------------: |
| Earlier colour calculations, 288 cells                |  0.730 ms |        1.507 ms |
| Cached colour reads, 288 cells                        |  0.005 ms |        0.016 ms |
| Earlier rebuild of 540 date labels                    | 27.372 ms |       54.060 ms |
| Expand 450 to 540 dates, formatting only 90           |  0.161 ms |        0.169 ms |
| Memory-store edit + flush, 180 days / 2,401 events    |  1.047 ms |        1.346 ms |
| Memory-store edit + flush, 1,825 days / 24,334 events | 17.189 ms |       21.009 ms |

Both edit runs produced 40 cell-subscriber notifications for 40 edits, despite
480 subscribers and separate save acknowledgements. This verifies notification
scope, not an assertion about native render counts. Palette construction occurs
when definitions change and is outside the cached-read timing. Date setup for
already-loaded days is outside the incremental timing.

The five-year result exposes remaining data-processing cost: live reducers copy
value/history containers, and the memory adapter still validates full projections.
The production SQLite adapter also parses/checks/rewrites a full JSON projection
per edit. Its event ordering, atomic writes, failure/retry and backups were not
changed in this pass. A next data-engine pass should measure native timings and
consider per-entry SQLite projections plus more local in-memory updates, with
explicit migration and recovery tests. A new remote backend is not involved.

## Optional completed-row filtering

Hide completed today is off by default. When enabled, the grid selects a
primitive mask through `completedHabitsSelection`: only today's checkbox
completion changes notify it. Numeric edits, other dates, preferences and save
acknowledgements leave the mask unchanged. When disabled, entry edits retain
the existing per-cell update path without notifying the container.

Filtering changes displayed row geometry, so a qualifying check does rebuild the
visible rows. This is the cost of the explicitly requested optional behaviour,
not a replacement for stable rows by default. Names, cells and fallback geometry
use the same displayed IDs; date-heading recorded-state reads the full active
list. Native scrolling remains on the UI thread. Hidden/archived order slots
stay fixed when the displayed subset is reordered.

## Large descriptions

The compact-card experiment is superseded by Notes/Statistics tabs. The initial
panel alone mounts, then its neighbour warms after 200 ms or first navigation.
Both remain mounted in a fixed-width native horizontal pager, excluded from
touch/accessibility when inactive. `useHabitPages.ts` sends no per-frame React
updates: shared values move the floating selection pill; an aligned-offset reaction
updates selection once. Native directional locking handles horizontal /
vertical interaction; orientation aligns the settled page at the new width.
Statistics does not render notes. Habit edit
and Versions use bounded excerpts; the edit form memoizes them. Full note reading
uses native FlatList passages with top-level list items split into individual
rows, preserving nested contents and numbering. Its disposable cache is capped
at five documents/100,000 characters.

The DOM editor memoizes startup parsing, prepares byte-preserving snapshots from
that content, and avoids transaction-driven whole-component renders. Toolbar
selectors remain immediate. Formatting-aware length validation still checks each
new immutable document, with per-editor weak serialization/snapshot caches
sharing results across validation/reporting/Done. Unchanged snapshot reads do not
serialize again. Text crosses the DOM/native bridge after 200 ms quiet or a
one-second deadline. Selection/scroll settles at 250 ms and sends only position
when text has already been reported. Background and exact Done/Close snapshots
remain explicit; native draft writes keep their 350 ms debounce.

The synthetic phone fixtures are Go for a walk (1,874), Read (7,723), Meditate
(17,657 characters), only in Sample data. A bounded Node/jsdom diagnostic counted
75 → 25 serializations for 25 edits plus 25 unchanged snapshot reads at every
size. Node timings do not establish iPhone responsiveness. Opening stats, the
reader and editor, rapid typing, selecting/formatting, immediate Done, background
recovery and long scrolling must be checked on the device. The founder confirmed the long-note reader feels instant on the iPhone; they
subsequently authorised a Notes-first tab trial to avoid a second navigation tap.
The founder confirmed the corrected first editor opening starts at the beginning
without a black jump. The tab layout and wider resume/keyboard matrix still need
device review.
First editor opens align caret/viewport at the start, with viewport/content resize
restoration until deliberate interaction. Existing matching bookmarks remain.
The writing area owns scrolling, with DOM roots clipped to prevent outer scrolling;
startup feedback does not imply the WebView/editor initialization cost is gone.

## Categorical and free-text cells

Daily values include primitives and stable arrays of category IDs. Per-cell
subscriptions retain unchanged references through save acknowledgements; category
corrections compare array contents across SQLite serialization. Native horizontal
scroll synchronization and the loading backdrop are unchanged.

Grid previews collapse whitespace and cap measurement at 32 Unicode characters,
with a consistent 12-point font before app/OS scaling and native tail ellipsis.
`gridEntryText.ts` derives 1–3 lines from measured row height and combined scale.
Column width controls native wrapping, not font compression. Native fitting is
disabled for text/categories because our iOS renderer ignores `minimumFontScale`.
Full values remain in storage and the editor. Recording statistics virtualize
their dated entry list rather than mounting every full text value. Browser checks cover layout,
not native font fitting or iPhone frame rates.
