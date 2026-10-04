# Habit actions and management

Implemented 4 October 2026 after founder authorization. Native gesture and layout
acceptance remains pending on the iPhone 16 Pro.

## Main grid

Tap a habit name to open its statistics panel. It currently shows the past fourteen
local calendar days and recorded-day counts, excluding future dates. Numeric zero
is a recorded day. Streaks, targets, schedules, and completion rates await separate
product rules; no scoring formula is inferred from the Loop reference.

Hold a name for 380 ms to select its row with a haptic tick and show an anchored
menu: Colour, Edit habit, Reorder, Archive. Releasing leaves the menu open. Each
option requires a separate tap; the initial hold cannot choose a menu item.
A tap outside dismisses it. The menu stays within the grid viewport and scrolls
when larger text or landscape needs room.

Keep holding and move vertically more than ten points to drag that row. The menu
dismisses, a floating row follows the finger, and neighbours shift to preview the
order. Releasing saves one ordering change. Edge scrolling allows long lists.
Touch cancellation, additional fingers, rotation, foreground loss, or changed
habit IDs cancel the draft without saving. Ordinary swipes before the hold scroll
normally; date cells retain direct recording actions.

Reorder opens a deliberate mode with handles and a Done control. Names drag
immediately in this mode, and cells cannot record until it ends. VoiceOver name
actions provide statistics, edit, colour, reorder, archive, and Move up/Move down.
No essential operation depends on discovering a hold gesture.

## Management and editing

Settings → Manage habits offers Add, Arrange, the active list, and archived habits
with Restore. Arrange closes the sheet and enters grid reorder mode. Editors and
colour pickers use Done to apply and Close to discard drafts; picking a colour
inside the editor updates its draft until the outer Done saves the habit.

New habits specify a name, checkbox or numeric daily-total type, colour, and an
optional numeric unit. Numeric habits without a unit remain numeric. Names are
limited to 200 characters and units to 80. Existing habit type is read-only in
this editor, preventing accidental reinterpretation of recorded values. A unit
edit changes the label, not historical amounts or their scale.

Archiving hides a habit from the grid while retaining its definition, values, and
history. Restoring uses the retained position. Reordering active habits preserves
archived slots in the full order. Names, units, colours, creation, archival, restore,
and ordering persist and are undoable. Structural habit/order actions do not
coalesce, so dropping one row is exactly one Undo step. Global preferences remain
outside Undo.

## Storage compatibility

New events and backup containers use version 3. A habit change captures its stable
ID, position, and before/after definition; creation uses a null before-definition.
Undoing creation can remove it only after its entries have been undone. This is
not a permanent deletion feature. An order change carries exact before/after ID
lists, validated as a permutation of every stored habit.

Old v1/v2 logs and backups remain readable, unchanged. Legacy numeric habits are
inferred from their unit field; new definitions may use an explicit type and an
archived flag. No SQL schema change or reseeding occurs. See [STORAGE.md](STORAGE.md)
and [the synthetic v3 export](examples/storage-v3.json).

Implementation: HabitName registers native responder callbacks; useHabitReorder
owns temporary order, cancellation, geometry, edge scrolling, and the floating
row. Only a completed drop reaches the store. The existing UI-thread horizontal
scroll synchronization is retained. See the official React Native
[Pressable](https://reactnative.dev/docs/0.86/pressable) and
[PanResponder](https://reactnative.dev/docs/0.86/panresponder) references.
