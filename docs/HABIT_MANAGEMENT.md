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
optional numeric unit. Numeric habits without a unit remain numeric. Names are
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

New events and backup containers use version 4; version 3 introduced definitions
and ordering, and version 4 adds optional icons. A habit change captures its stable
ID, position, and before/after definition; creation uses a null before-definition.
Undoing creation can remove it only after its entries have been undone. This is
not a permanent deletion feature. An order change carries exact before/after ID
lists, validated as a permutation of every stored habit.

Old v1/v2/v3 logs and backups remain readable, unchanged. Legacy numeric habits are
inferred from their unit field; new definitions may use an explicit type and an
archived flag. No SQL schema change or reseeding occurs. See [STORAGE.md](STORAGE.md)
and [the synthetic v4 export](examples/storage-v4.json).

Implementation: HabitName registers native responder callbacks; useHabitReorder
owns temporary order, cancellation, shared geometry, and edge scrolling.
ReorderRow applies the same translation to the actual name and every date cell. Only a completed drop reaches the store. The existing UI-thread horizontal
scroll synchronization is retained. See the official React Native
[Pressable](https://reactnative.dev/docs/0.86/pressable) and
[PanResponder](https://reactnative.dev/docs/0.86/panresponder) references.

## Motion

Menu entry uses a small six-point lift and fade; dismissal fades. The founder
accepted the translation smoothness but requested faster settling and identical
row appearance throughout the drag. ReorderRow now translates the actual name
and date-cell views with their existing fonts, icons, units, checkboxes, backgrounds,
and dividers. It raises only the dragged row's stacking order. No separately
styled card, shadow, handle, or faded copy replaces the row.

Neighbours and the dropped row share a faster, overdamped spring (stiffness 650,
damping 54, mass 1, energy threshold 0.0001). The held row follows the finger
without a spring delay. On release it settles to zero translation in its new
layout position; ending drag state causes no appearance swap. New drags wait for
that short settling phase to complete. Cancellation before a drop saves nothing;
a completed drop saves immediately, independent of animation. Navigation into
statistics slides, and Settings page changes fade. New transitions respect Reduce
Motion. Phone acceptance of the revised drag remains pending.
