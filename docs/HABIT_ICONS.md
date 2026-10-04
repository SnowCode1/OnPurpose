# Optional habit icons

Requested by the founder on 4 October 2026. A habit may have no icon, an emoji, or
a monochrome pack icon. Existing habits remain name-only until edited. An icon
appears beside the name in the grid, statistics, and archive list. It is decorative
for accessibility: the habit's name remains its spoken identity. Icons never
replace names or shrink date-cell touch targets.

## Selection

Hold a habit name → Edit habit → Icon, or use Icon while adding a habit.

- **None** removes the icon without reserving an empty icon slot in the row.
- **Icons** provides all 1,512 Regular designs from Phosphor core 2.1.1. Common
  starts with the original 56 habit choices; All icons browses the complete set.
  Search always covers the full catalogue, matching multiple words across names,
  aliases, categories, and tags. The selection
  uses the habit's current draft colour. Applied icons track subsequent colour edits.
- **Emoji** offers 32 presets and a text field for the system emoji keyboard or
  paste. Emoji keep their platform appearance. Skin tones, joined sequences,
  flags, and keycaps count as one emoji; plain text and multiple emoji do not.

The picker's Done applies to the editor draft; the editor's Done saves the habit.
Close discards the current picker/editor draft. The picker replaces the form's
scrolling content and keeps Done visible rather than stacking another long section.
Its own bounded FlatList renders a window of icon rows, with adaptive column count;
it is not nested in the editor ScrollView. Tabs/search scroll with the results so
the picker can shrink in landscape or above the keyboard.

## Assets and code

[Phosphor core](https://github.com/phosphor-icons/core) supplies the regular SVG
paths, pinned to npm `@phosphor-icons/core@2.1.1`. `src/phosphorPaths.ts` contains
the complete regular glyph set. Its [MIT notice](licenses/PHOSPHOR_LICENSE.txt) is retained.
The package is not a runtime dependency; existing react-native-svg draws the paths.
There is no remote image fetch and no new native module.

`src/habitIconCatalog.ts` owns generated stable IDs, labels, and search terms.
`src/commonHabitIcons.ts` preserves the curated order, labels, and habit aliases.
`src/searchHabitIcons.ts` indexes the full catalogue for multiword search. Keep saved IDs
and their glyphs when extending the catalogue. `src/HabitSymbol.tsx` draws icons;
`src/HabitIconPicker.tsx` owns selection UI. `src/habitIcons.ts` owns namespaced
values, labels, and validation using pinned `emoji-regex@11.0.0`. Do not tighten
validation on dependency updates without testing previously accepted sequences.

## Persistence

Version 4 adds `icon?: string` to a habit definition, represented as e.g.
`phosphor:book-open` or `emoji:📚`. None omits the field. Null, unknown packs/IDs,
URLs, malformed emoji, and extra object fields are rejected before saving/import.
Old v1/v2/v3 events retain their original validation and interpretation. A log may
upgrade but cannot downgrade after a v4 event. The SQL schema stays at version 1.

Applying/removing icons is an ordinary before/after habit-definition change.
It saves atomically, appears in History, survives archive/restore and reload,
and supports Undo/Redo. Icon-only edits read “Icon changed” or “Icon removed”.
The v4 backup exports every raw event, including older events without rewriting.
See [STORAGE.md](STORAGE.md) and [the synthetic v4 backup](examples/storage-v4.json).

Tests cover valid emoji sequences, malformed inputs, catalogue/glyph completeness,
History descriptions, SQLite reload, removal, archive restore, Undo/Redo, legacy
version boundaries, downgrade rejection, and backup round-trips.

## Catalogue scope and regeneration

The founder approved expanding Phosphor on 4 October 2026. All 1,512 distinct
regular designs are now available. The upstream 9k+ total counts six styles:
1,512 × thin/light/regular/bold/fill/duotone = 9,072 assets in core 2.1.1. Regular
covers every design once. A second pack remains a proposal for demonstrated gaps.

To regenerate, download the official npm tarball for `@phosphor-icons/core@2.1.1`,
extract it into an ignored local folder, then run:

```sh
node scripts/generate-phosphor.mjs /absolute/path/to/extracted/package
```

The generator verifies package/version, all 1,512 SVG structures, and retained
common IDs; it writes deterministic, formatted catalogue/path modules. These
are committed, so normal development/builds need no asset download. Preserve
the upstream MIT notice and all previously accepted IDs on future upgrades.
Expanded choices use the same v4 representation; older builds with the 56-icon
registry will reject backups containing unfamiliar IDs. Update the receiving
build before importing those backups.
