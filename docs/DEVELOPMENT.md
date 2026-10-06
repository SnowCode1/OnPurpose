# Development on Linux with an iPhone

Verified against official sources on 4 October 2026. Versions and service
requirements can change; recheck the linked sources before an upgrade/release.

## What the tools mean

- **React:** the system for describing the interface and how it responds to taps.
- **React Native:** renders that interface using native phone controls.
- **TypeScript:** JavaScript with checks that catch many mistakes before running.
- **Expo:** the tools and compatible libraries around React Native.
- **Metro:** the local server that sends development JavaScript to the phone.
- **Expo Go:** a prebuilt app for trying supported Expo code on your phone.
- **Development build:** your own app with development tools and your native
  dependencies; needed as the project moves toward production.
- **EAS Build / Submit:** Expo's cloud build and upload services. They let a Linux
  machine initiate iOS builds and send them to App Store Connect.

React Native with Expo is our initial implementation choice, not the only way to
make an iOS app. It fits the available Linux computer and physical iPhone.

## Installed foundation

Node.js 24.13.1 and npm 11.19.1 were present at setup. `.nvmrc` selects Node 24
for contributors who use nvm. npm and `package-lock.json` are the package system.
The app was generated from `blank-typescript@sdk-57` using create-expo-app 5.0.0.
Use the lockfile for the exact installed dependencies.

## First run on the iPhone

1. Install [Expo Go from the App Store](https://apps.apple.com/app/expo-go/id982107779).
   The listing checked during setup offers version 57.0.9 with React Native 0.86
   and requires iOS 16.4 or later. Confirm your phone's installed version.
2. Create a free Expo account if needed. Run `npx expo login` in this folder and
   sign in to the same account in Expo Go. Enter credentials in the terminal/app,
   never in project files or a chat message.
3. Put the computer and phone on the same Wi-Fi network.
4. In this folder, run `npm start`. On a fresh checkout run `npm ci` first.
5. Scan the QR code with the iPhone Camera and open the link in Expo Go. Allow
   local-network access if iOS asks.
6. Tap checkbox cells in the sample grid; a second tap unchecks them. Tap a
   numeric cell to enter a daily total. Names open the Notes/Statistics sheet; hold a name for actions or drag-to-reorder.
   Entries, colours, and haptic preferences now save locally; reload to verify. The founder
   requested removal of the bottom demo notice to give the grid more space.
7. Edit `App.tsx` and save. The phone should refresh with the change.

The founder confirmed the app opens on the iPhone 16 Pro. Its exact iOS version
and detailed runtime/accessibility checks remain to be recorded.

## Commands

| Command                  | Use                                                        |
| ------------------------ | ---------------------------------------------------------- |
| `npm start`              | Start Expo Go development over the local network           |
| `npm run start:clear`    | Restart with a cleared Metro cache                         |
| `npm run start:tunnel`   | Try a tunnel if Wi-Fi isolation blocks local access        |
| `npm run web`            | Browser preview for convenient Linux layout work           |
| `npm run typecheck`      | TypeScript checks                                          |
| `npm run lint`           | ESLint checks                                              |
| `npm run format`         | Format source and docs                                     |
| `npm run check`          | All local static checks                                    |
| `npm run doctor`         | Expo's environment/dependency diagnostics                  |
| `npm run export:ios`     | Compile/export iOS JavaScript and assets locally           |
| `npm run benchmark:grid` | Synthetic CPU timings for grid preparation and store edits |

Stop a foreground server with Ctrl+C. Do not use `expo run:ios` or the simulator
shortcut on Linux: the Apple toolchain and iOS simulator require macOS.

## If the phone will not connect

- Check the same account, same Wi-Fi, local network permission, and Expo Go SDK.
- Temporarily disconnect a VPN if it prevents LAN routing. On guest Wi-Fi,
  devices may be isolated even when the network name is the same.
- Check whether your firewall allows the Metro server's displayed port on your
  trusted local network. Do not disable the firewall wholesale.
- Try `npm run start:tunnel`. Expo may offer to install its ngrok helper; tunnel
  availability depends on an external service and can be slower.
- For SDK mismatches, compare `package.json` with the installed Expo Go version.
  Run `npm run doctor`; use `npx expo install --fix` after an intentional upgrade.
- Some Expo troubleshooting pages still describe the earlier App Store freeze
  at SDK 54. The live App Store listing checked for this setup lists SDK 57-era
  Expo Go. Use the installed version and current download listing as evidence.

## MCP and testing

Expo has an [official MCP server](https://docs.expo.dev/mcp/) at
`https://mcp.expo.dev/mcp`, authenticated with an Expo account through OAuth.
It can help with docs and EAS builds. Current documented iOS local automation
is limited to simulators on macOS; physical iPhones are not supported. It will
not let a Linux agent remotely tap this phone through Expo MCP.

MCP is optional for the first milestone and is not configured in this repository.
Use the physical phone for interaction testing and share observations/screenshots
or recordings when useful. Browser checks on Linux help us iterate, but do not
replace iPhone checks. Re-evaluate MCP if its device support changes.

## Share an app preview from the phone

Preview sharing is an opt-in development tool. It captures the visible native
app from any screen using a deliberate face-down-and-back gesture, then uploads
a PNG to a receiver on your computer. Title holds remain optional shortcuts. The receiver writes `.dev/previews/latest.png` and a dated copy. An
assistant with workspace access can open those files directly; say “check the
latest preview” after the app confirms it was saved. No photo-library permission
or manual screenshot transfer is needed. This is not streaming or remote control.

1. Copy `.env.example` to `.env.local` if you do not already have local settings.
2. Set `EXPO_PUBLIC_DEV_PREVIEW=true`.
3. Set `EXPO_PUBLIC_PREVIEW_URL` to your computer's LAN address, for example
   `http://192.168.1.100:8765`. On Linux, `ip -4 route get 1.1.1.1` shows the
   current source address after `src`. Do not use the phone's IP or localhost.
4. Generate a random pairing token with the command in `.env.example`; put it in
   `EXPO_PUBLIC_PREVIEW_TOKEN`. Both the app and receiver read the same file.
5. Start `npm run preview:server` in a second terminal and leave it running.
6. Fully reload the app in Expo Go. If a changed setting does not appear, restart
   `npm start` and reload. Environment changes need more than Fast Refresh.
7. From any screen (including pickers and the description editor), gently turn
   the phone so its screen faces down. Hold until a firm haptic tap (roughly half
   a second), then turn it back toward you within four seconds and pause briefly.
   The settled screen is captured; two firm taps confirm that the receiver saved
   it. This does not use or change Expo Go's shake gesture.
8. Holding a month/year or available title still works. Settings → Development also has a
   development-only **Share preview** button and gesture instructions as an
   accessible fallback. There is no new overlay or layout on the main grid.
9. An upload failure offers **Retry**, sending the already-captured image rather
   than capturing the error alert. A new gesture intentionally captures a fresh
   screen. The app distinguishes capture, network/timeout, pairing and receiver
   failures. Successful saves are announced to VoiceOver without a popup.

Only one capture/upload can run at a time across all triggers. Motion sampling
runs at 10 Hz while the app is active, with no per-sample React updates. It stops
and cancels the gesture on backgrounding. A stable viewing pose, face-down dwell,
settled return, deadline and cooldown guard against ordinary rotation/shaking or
setting the phone down for a long time. No motion data is stored or uploaded.
The real device still needs acceptance testing for gesture comfort and captures
of native sheets, keyboards and DOM editors.

On the founder's Linux workstation the receiver was found stopped on 5 October.
It has been restarted as `onpurpose-preview.service`, a transient user service
with a 256 MB memory bound and Restart=on-failure. It keeps running independently
of the agent's terminal, but is not a permanent boot-time service. Logs stay in
ignored `.dev/preview-receiver.log`. Check/stop it with
`systemctl --user status onpurpose-preview` /
`systemctl --user stop onpurpose-preview`. Other checkouts can continue using
`npm run preview:server`; if the service already owns the port, do not start a
second receiver. The authenticated health check passed after restarting.

On 6 October the old transient service was no longer present. The current receiver
runs in a VS Code terminal using `npm run preview:server`; authenticated health
checking passes. Keep that terminal open alongside `npm start`. A new chat alone
does not stop either process. A terminal closure, logout or reboot may require
restarting them. The failed-preview alert's Retry sends the retained image; another
gesture captures a new one. Do not launch a second receiver while the first owns
the configured port.

The initial workspace has `.env.local` configured and enabled. Screenshots and
local environment settings are ignored by Git. Dated captures are retained until
you delete them. The native snapshot includes the visible app area; it does not
capture off-screen scroll content. Dialog/keyboard rendering should be verified
on the actual iPhone. Browser capture is not enabled.

To disable: set `EXPO_PUBLIC_DEV_PREVIEW=false`, reload the app, and stop the
receiver with Ctrl+C. The app also checks `__DEV__`, so production JavaScript
has no capture/upload gesture or code even if the env flag is accidentally left on.
The native library may still be linked into a native build; the switch gates the
feature, not dependency installation.

Use this on your trusted local network. The receiver binds only to the configured
address, checks the pairing token, rejects browser-origin requests, limits uploads
to 12 MB of JSON, and exposes no screenshot download endpoint. The token is
embedded in the development bundle, not a production secret. The local HTTP
connection is unencrypted. Do not port-forward or expose this receiver publicly.
Expo's Metro tunnel does not tunnel this separate receiver. If changing networks,
update the URL, restart the receiver, and reload the app; allow only the receiver
port on your trusted network if a firewall prevents access.

Run `npm run test:preview` for receiver authentication, payload, size, persistence,
and failure-response checks. Source references:
[Expo environment variables](https://docs.expo.dev/guides/environment-variables/)
and [native screenshots](https://docs.expo.dev/versions/latest/sdk/captureRef/).

## Known dependency audit findings

After adding UI-thread scrolling and custom colour controls, npm audit reports 27 findings
(20 high, 7 moderate), including
transitive `braces`, `node-forge`, and `uuid` dependencies in the Expo/React Native
toolchain. The view-shot, Reanimated, Worklets and related Metro findings inherit existing
React Native/toolchain advisories through dependency relationships. The suggested automatic fixes include downgrading Expo to SDK 44 and
React Native to 0.72; these are incompatible with this setup. Do not run
`npm audit fix --force` as a routine fix. Expo Doctor compatibility checks pass,
but that does not resolve the audit findings. Track upstream patches and reassess
the affected paths before beta/public release. Audit counts can change over time.

## Official references

- [Create the first app](https://docs.expo.dev/tutorial/create-your-first-app/)
- [Start developing and connect a device](https://docs.expo.dev/get-started/start-developing/)
- [Expo Go downloads](https://expo.dev/go)
- [Expo SDK 57 release notes](https://expo.dev/changelog/sdk-57)
- [iOS simulator requirements](https://docs.expo.dev/workflow/ios-simulator/)
- [Development builds](https://docs.expo.dev/develop/development-builds/introduction/)

## Portrait and landscape

The app configuration permits rotation; the grid measures usable width after
safe-area insets. Disable iPhone Portrait Orientation Lock to test landscape.
After changing `app.json`, exit and reopen the project in Expo Go so the manifest
is reloaded; Fast Refresh alone may keep the previous orientation setting.
Share both orientations using the same long press on the month/year label. Test numeric
entry with the keyboard open in landscape as well as the main grid.

## Animation and colour controls

For grid/cell rendering and store timing, enable the development-only
`EXPO_PUBLIC_DEV_PERFORMANCE` flag and inspect React Native DevTools. It is enabled
in the founder's ignored local environment for the current performance pass.
See [PERFORMANCE.md](PERFORMANCE.md) for counters, reproducible benchmarks,
measurement limits, and the remaining long-history storage work.

Reanimated/Worklets, the community Slider, and Expo LinearGradient are installed
with SDK-compatible versions for Expo Go. Reanimated's Babel plugin is supplied
by `babel-preset-expo`; no custom Babel configuration is needed. Restart Metro
with `npm run start:clear` and fully reload Expo Go after adding these libraries
so cached transforms do not retain the previous configuration.

[Expo Reanimated setup](https://docs.expo.dev/versions/v57.0.0/sdk/reanimated/)
and [UI-thread scroll synchronization](https://docs.swmansion.com/react-native-reanimated/docs/scroll/scrollTo/).

## Main-page controls

The compact top bar stays visible: ONPURPOSE at left, Today in the centre while
browsing away, and history/gear buttons at right. Tap month/year beside the day
headings for the date menu. History and Settings open native sheets; close using
Close or swipe down on iOS. The grid stays mounted so closing preserves your place.

Today’s space stays reserved to prevent shifts. A text-free moving highlighted
streak on the existing divider beneath the date headings replaces pull text.
Its right end stays fixed as it grows leftwards; no border is added.
The threshold haptic still marks readiness; release continues smoothly into
future dates. Date headings remain scrollable, without a hidden tap-to-return.

Hold ONPURPOSE, month/year, or a dialog/panel title to share a development preview.
History shows active habit actions with grouped undo/redo. Settings has a persistent haptic
toggle and full change-based backup export/restore. The grid stays mounted behind
these panels. See STORAGE.md and the persistence phone checks in TESTING.md. Icons use `react-native-svg` 15.15.4, installed
with Expo’s SDK-compatible installer and included in Expo Go.
[Expo SVG reference](https://docs.expo.dev/versions/v57.0.0/sdk/svg/).

## Local storage in development

The iPhone now keeps a versioned SQLite database across Expo reloads. Changing
code does not deliberately wipe the store or reseed sample habits. Expo Go and a
standalone app have separate containers: export a backup before moving builds or
uninstalling. No reset command or destructive recovery button is provided.

After adding native storage/file dependencies, fully reload Expo Go (restart
Metro with `npm run start:clear` if it cannot resolve an installed module).
Settings → Backups → Export backup opens the share sheet; choose Save to Files. Restore
backup validates first and asks before replacing data, retaining a local copy.

New habit edits use version-12 events with grouped actions; global preferences save
outside visible History/Undo. Exports use container version 12; existing version-1/2/3/4/5/6/7/8/9/10
backups remain importable and old log records stay unchanged. Fully reload Expo Go
to test storage updates. Do not downgrade to an older build after writing v12 data;
older builds cannot interpret it and will refuse to load rather than reset.
The web preview uses separate browser localStorage, not the iPhone SQLite file.

Run `node --max-old-space-size=256 --test --test-timeout=15000 scripts/storage.test.mjs` for focused storage/recovery tests, and
`npm test` for the full suite. These tests use Node 24's SQLite binding against the
production SQL/replay logic. Native bridge and Files UI still need phone testing.

Add a checkbox or numeric habit from the row at the bottom of the grid. Hold a
name to edit its name/unit/colour, reorder, or archive. Settings → Archived habits
restores rows with their entries and retained slots, or deletes them after
confirmation. History can undo either action, including every deleted record.
Tap a name for a full-screen statistics view. See [HABIT_MANAGEMENT.md](HABIT_MANAGEMENT.md)
for gestures and [STATISTICS.md](STATISTICS.md) for calculation rules. Run
`node --max-old-space-size=256 --test --test-timeout=15000 scripts/statistics.test.mjs` for focused statistics coverage.

The full-screen description editor now uses a bundled Expo DOM/Tiptap surface
for live formatting and local Undo/Redo. Fully reload after installing these
dependencies; see [DESCRIPTIONS.md](DESCRIPTIONS.md). Grid and statistics remain
native. Test commands limit heap, concurrency and runtime; retain those safeguards
for diagnostics as described in [TESTING.md](TESTING.md).

Habit icons are optional editor drafts (None, Icons, Emoji). See
[HABIT_ICONS.md](HABIT_ICONS.md) for the bundled Phosphor/Tabler catalogues, licences, and
version-4 representation. ReorderRow moves the actual name and cell views with
shared geometry; there is no separately styled floating row.

## Sample history for statistics

In Expo Go, Settings → Development → Sample data switches to an isolated, in-memory history with
all 12 presets and 180 days of fictional checkbox/numeric entries. The existing
brand label becomes SAMPLE DATA. Use the normal grid and statistics screens;
cell edits, Undo/Redo, colours, and archive actions affect only this sample session.
Settings → Development → Reset sample data rebuilds the fixture relative to today's local date.
Turning Sample data off returns to the real store. A new sample session is created
on full reload; in-session toggles retain the sample until it is reset.

`EXPO_PUBLIC_DEV_MOCK_DATA=true` in ignored `.env.local` starts directly in sample
mode after each full reload. Set it to false to start with real data. The founder's
local flag was enabled for the statistics review; `.env.example` defaults false.
The Settings toggle affects the running session, while a full reload follows this
startup flag. No app-data reset, seeding into an existing database, or backup import
is involved. Backup controls are hidden/disabled in sample mode, and its repository
rejects restore operations. History/archive indicate that sample changes are temporary.

`src/dev/sampleData.ts` builds deterministic valid v7 events and an independent
ChangeStore backed only by memory. `SampleDataMode.tsx` owns the development switch.
App loads both behind `__DEV__`; the production iOS export excludes their code
regardless of the env value. Verify this when changing the gate. Tests exercise
valid replay, DST/leap dates, statistics diversity, numeric zeros versus gaps,
independent stores, sample Undo/Redo, reset, and blocked sample backup replacement.

## Habit start-date control

The editor uses `@react-native-community/datetimepicker` 9.1.0, installed through
`npx expo install @react-native-community/datetimepicker` for SDK 57, with its config
plugin in app.json. Expo documents this component as [included in Expo Go](https://docs.expo.dev/versions/v57.0.0/sdk/date-time-picker/).
Fully reload after installing it; production/development native builds include it
on their next build. The web-specific StartDateField keeps browser preview separate
from the native picker. Native presentation/VoiceOver still require phone checks.

## Habit descriptions

Markdown/plain-text notes are available during creation/editing and appear before
statistics. The full-screen editor uses the pure-JavaScript markdown-it browser
build; no additional native build is required. Fully reload Expo Go to populate
placeholder notes in the current sample and existing real store. Applied notes use
v9 events, with v1–v8 replay retained. See [DESCRIPTIONS.md](DESCRIPTIONS.md) for
editor drafts, links, history comparison and recovery, and TESTING.md for phone QA.

## Shared text sizing

Use `Text`/`TextInput` from `src/Typography.tsx` for app text, and
`useAppWindowDimensions` where layout depends on font scale. The provider applies
only the app multiplier; native controls retain OS font scaling. The layout hook
combines both scales, as does the DOM editor. `textSize.ts` owns validated bounds
and pure style calculations. Do not independently scale nested text or override
native `defaultProps`. Fixed icons/checkbox glyphs remain decorative.

The founder confirmed the global gesture works and statistics looks good on
5 October. A new phone preview arrived and was inspected. At their request,
preview feedback was strengthened to one heavy arming tap and two heavy saved
taps, 110 ms apart; the stronger pattern still needs subjective phone feedback.

### Large-note sample fixtures

Sample data includes progressively longer fictional notes on Go for a walk
(1,874), Read (7,723) and Meditate (17,657 characters). Reload or use Settings →
Development → Reset sample data after changes. Test the Notes-first sheet, Statistics
and Edit at each size, including immediate Done after typing. `sampleDescriptions.ts`
extends only the isolated sample definitions; never use it to update real habits
or replace their saved descriptions. See DESCRIPTIONS.md and TESTING.md for the
reader/editor performance and experimental compact-card flow.

Sample mode now adds Workout (multiple categories) and Daily highlight (free
text), with sixty days of fictional values. The existing twelve-habit v7 fixture
remains unchanged; `sampleRecords.ts` appends v10 examples only to the in-memory
sample store. Reload/reset sample mode to see them. Real lists are not populated
with these examples. Create either type through Add habit. See
HABIT_MANAGEMENT.md and STORAGE.md for entry/option drafts and backup compatibility.
