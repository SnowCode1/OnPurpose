# OnPurpose

A proposed iPhone habit tracker designed to make recording a completed habit
almost effortless. Open the list, tap familiar positions, and get on with life.

**Early development.** The name is provisional. This repository currently has an
Expo/React Native foundation and a 12-row grid demo. Adaptive columns work in
portrait and landscape. Scroll into the past or deliberately pull beyond today
to reveal future dates; checkbox and daily-total entries work in both directions.
Habit details offer 24 colour presets, a custom visual picker, and hex input.
Optional emoji or searchable Phosphor/Tabler icons help identify habits; pack icons use
the row colour.
Entries, colours, and the haptic setting now persist locally in SQLite. History
shows active habit actions with grouped undo/redo; rapid corrections to the same
entry become one action, and global settings stay outside History/Undo. Settings
supports change-based backup export/restore, retaining the full underlying log.
Add habits at the bottom of the grid. Hold a name for editing, colours, archival,
or drag ordering. Settings → Archived habits restores archived rows with their
entries and positions. Tap a name for full-screen statistics: completion trends
and streaks for checkboxes, totals and averages for numbers, weekday patterns, and
a monthly calendar. Optional Markdown descriptions sit above statistics, with a
full-screen editor, links, recoverable drafts and undoable history. Comments and goal/scheduling rules remain to be implemented. Sample habits are seeded once; they no longer reset on reload.

## Run locally

Use Node.js 24 LTS and npm. Dependencies have already been installed in the
initial workspace; a fresh checkout should run `npm ci` first.

```sh
npm ci
npm start
```

Install Expo Go on your iPhone, sign in to Expo on the computer and phone with
the same account, and scan the terminal QR code with the iPhone Camera. Keep
both devices on the same Wi-Fi. See [development setup](docs/DEVELOPMENT.md) for
the full first-run steps and troubleshooting. For an Android phone over USB, see
[Android phone over USB](docs/DEVELOPMENT.md#android-phone-over-usb).

```sh
npm run web          # browser preview on Linux
npm run check        # TypeScript, lint, and formatting
npm test             # storage/replay/recovery, calendar, layout, colour, receiver tests
npm run export:ios   # verify the iOS JS bundle; not a signed iOS build
npm run export:android  # verify the Android JS bundle
```

For gesture-based screenshot sharing from the iPhone, enable the settings from
`.env.example` in `.env.local`, run `npm run preview:server`, and reload the app.
Long-press the **month/year label** (or a dialog/panel title) to save the
visible app to `.dev/previews/latest.png`. A success haptic confirms receipt.
The initial workspace is already configured. See the
[preview-sharing guide](docs/DEVELOPMENT.md#share-an-app-preview-from-the-phone).

## Project documents

- [Project goals and open questions](PROJECT_GOALS.md)
- [Documentation index](docs/README.md)
- [Development setup](docs/DEVELOPMENT.md)
- [Architecture and current limitations](docs/ARCHITECTURE.md)
- [Incremental storage and export design](docs/STORAGE.md)
- [Habit descriptions](docs/DESCRIPTIONS.md)
- [Technical decisions](docs/DECISIONS.md)
- [Testing the three-second idea](docs/TESTING.md)
- [Path to the App Store](docs/RELEASING.md)
- [Contributing](CONTRIBUTING.md)
- [Agent instructions](AGENTS.md) and [Claude entry point](CLAUDE.md)

## Licence

Copyright (C) 2026 Daniel Adams

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU General Public License as published by the Free Software
Foundation, either version 3 of the License, or (at your option) any later
version. It is distributed WITHOUT ANY WARRANTY; see [LICENSE](LICENSE) for the
full terms.

The generated Expo template's MIT notice and other third-party notices are
retained under [docs/licenses](docs/licenses/EXPO_TEMPLATE_LICENSE.txt).
