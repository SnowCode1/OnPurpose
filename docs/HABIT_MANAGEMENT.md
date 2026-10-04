# Habit actions and management

Implemented 4 October 2026 after founder authorization. Native gesture and layout
acceptance remains pending on the iPhone 16 Pro.

## Main grid

Tap a habit name to open a full-screen statistics view. Back returns to the same
mounted grid and date position. Checkbox rates and streaks, numerical totals and
averages, time-range charts, weekday patterns, and a calendar are described in
[STATISTICS.md](STATISTICS.md). Editors remain compact dialogs.

Hold a name for 380 ms to select its row with a haptic tick and show an anchored
menu: Colour, Edit habit, Reorder, Archive. Releasing leaves the menu open. Each
option requires a separate tap; the initial hold cannot choose a menu item.
A tap outside dismisses it. The selected name stays reachable while the menu is
open: keep holding before dragging, or release and hold that name again. Press
re-entry does not reset a recognized hold. The menu stays within the viewport and scrolls
when larger text or landscape needs room.

Keep holding and move vertically more than ten points to drag that row. The menu
dismisses, the actual name and date cells follow the finger, and neighbours shift to preview the
order. Releasing saves one ordering change. Edge scrolling allows long lists.
Touch cancellation, additional fingers, rotation, foreground loss, or changed
habit IDs cancel the draft without saving. Ordinary swipes before the hold scroll
normally; date cells retain direct recording actions.

Reorder opens a deliberate mode with handles and a Done control. Names drag
immediately in this mode, and cells cannot record until it ends. VoiceOver name
actions provide statistics, edit, colour, reorder, archive, and Move up/Move down.
No essential operation depends on discovering a hold gesture.

## Management and editing

An Add habit row scrolls with the end of the grid, including when the list is empty.
Active habit actions live on the grid. Settings → Archived habits lists only
archived definitions, recorded-day counts, and Restore. Save status and retry
remain visible. There is no duplicate active-management screen.

Editors and colour pickers use Done to apply and Close to discard drafts; picking
a colour inside the editor updates its draft until the outer Done saves the habit.

New habits specify a name, checkbox or numeric daily-total type, colour, optional
emoji/pack icon, and an
optional numeric unit. The creation dialog has no extra “Make it yours” heading.
Start date defaults to local Today and is editable in creation and existing-habit
editors. iOS uses a compact native date picker; web preview uses a validated ISO
date input. Earlier dates support backfilling. Done applies the draft and Close
discards it. Legacy habits display their inferred tracking date without rewriting
old events. Numeric habits without a unit remain numeric. Names are
limited to 200 characters and units to 80. Existing habit type is read-only in
this editor, preventing accidental reinterpretation of recorded values. A unit
edit changes the label, not historical amounts or their scale.

Archiving hides a habit from the grid while retaining its definition, values, and
history. Restoring uses the retained position. Reordering active habits preserves
archived slots in the full order. Names, units, colours, icons, creation, archival, restore,
and ordering persist and are undoable. Structural habit/order actions do not
coalesce, so dropping one row is exactly one Undo step. Global preferences remain
outside Undo.

## Storage compatibility

New events and backup containers use version 5 (editable start dates and row spacing); version 3 introduced definitions
and ordering, and version 4 adds optional icons. A habit change captures its stable
ID, position, and before/after definition; creation uses a null before-definition.
Undoing creation can remove it only after its entries have been undone. This is
not a permanent deletion feature. An order change carries exact before/after ID
lists, validated as a permutation of every stored habit.

Old v1/v2/v3/v4 logs and backups remain readable, unchanged. Legacy numeric habits are
inferred from their unit field; new definitions may use an explicit type and an
archived flag. No SQL schema change or reseeding occurs. See [STORAGE.md](STORAGE.md)
and [the synthetic v4 export](examples/storage-v4.json).

Implementation: HabitName registers native responder callbacks; useHabitReorder
owns temporary order, cancellation, shared geometry, and edge scrolling.
ReorderRow applies the same absolute animated Y position to the actual name and every date cell. Only a completed drop reaches the store. The existing UI-thread horizontal
scroll synchronization is retained. See the official React Native
[Pressable](https://reactnative.dev/docs/0.86/pressable) and
[PanResponder](https://reactnative.dev/docs/0.86/panresponder) references.

## Motion

Menu entry uses a small six-point lift and fade; dismissal fades. The founder
accepted the translation smoothness but requested faster settling and identical
row appearance throughout the drag. ReorderRow now moves the actual name
and date-cell views with their existing fonts, icons, units, checkboxes, backgrounds,
and dividers. It raises only the dragged row's stacking order. No separately
styled card, shadow, handle, or faded copy replaces the row.

Neighbours and the dropped row share a faster, overdamped spring (stiffness 650,
damping 54, mass 1, energy threshold 0.0001). The held row follows the finger
without a spring delay. On release it settles to the same absolute Y used by the committed order; ending drag state causes no appearance swap. New drags wait for
that short settling phase to complete. Cancellation before a drop saves nothing;
a completed drop saves immediately, independent of animation. Navigation into
statistics slides, and Settings page changes fade. New transitions respect Reduce
Motion. Phone acceptance of the revised drag remains pending.

## Swap flicker correction

The founder confirmed the actual-row appearance works, but reported flashes of
incorrect positions as rows exchanged places. Source inspection found that the
preview reordered native siblings while separately updating a compensating drag
transform. Layout and animation commits could disagree for a frame; the menu
only closes once at drag start and does not explain repeated swap flashes.

Keep sibling order unchanged during preview. Each name and date cell instead has
one absolute Y position, animated on the UI thread. Both column types have an
explicit total height. The preview and final drop share habitRowPositions, which
accounts for measured/wrapped row heights. At commit, keyed views may change
sibling order but their absolute positions stay the same. Measure the inner name
control's height, not the moving wrapper, to avoid per-frame layout callbacks.
The founder confirmed this removed the flicker. They then reported low frame rate
while dragging. Keep the fixed sibling order, but express the absolute Y as a
translateY from a constant top: 0 anchor. Animated top had triggered native layout
work each frame; the transform avoids that cost without reintroducing a moving
layout anchor. Native smoothness of this follow-up remains to be verified.

## Fast-swap frame cost

After the fixed-origin transform change, the founder reported stutter specifically
when quickly crossing other rows. Preview swaps still called setDraft in React,
rerendering HabitGrid and recreating its date cells/colour calculations. Remove
that state update: keep draft order in the drag ref and publish absolute Y targets
through a shared value. ReorderRow reacts to its own target on the UI thread;
unchanged targets do not restart springs. The held row's resting position is kept
ready for the final hand-off, including quick releases and Reduce Motion.

Committed geometry still sizes the grid because permutations preserve total height.
The native sibling order stays stable until commit. Begin/end/menu state still use
React, but crossings do not. Cancellation restores committed targets; completed
drops alone enter persistence. Native fast-swipe acceptance remains pending.

The founder confirmed preset icons and fast swaps work. The selected name behind
its open context menu now uses the habit colour at 12.5% opacity over black, in
place of neutral grey. Press feedback remains a lighter tint; dragging keeps the
normal row appearance. This colour change does not touch the gesture/animation path.

## Grid spacing

Settings offers Compact (44-point minimum), Standard (52, the previous default),
and Roomy (64). Name measurements remain authoritative for taller wrapped text
and numeric units; names, cells, loading dashes and reorder positions share them.
Font scaling can increase all three choices. Compact uses less vertical name
padding. Changing spacing keeps habit order, entries and horizontal position.
The preference persists outside habit History/Undo and is included in backups.
Sample-mode settings stay in its separate disposable store.
