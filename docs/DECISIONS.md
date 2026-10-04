# Decision log

## 008 — Past-only grid and habit colours

Date: 4 October 2026. Status: requested by the founder; implemented in the demo.

Start with today and the previous two days; today is the newest allowed date.
Keep names fixed horizontally and date headings visible during vertical scrolling.
Use inverted, virtualized date-column lists, append older dates as needed, and
provide a direct Today jump. Store demo values by stable habit ID and local date,
never by visible column index. Calendar-day arithmetic avoids DST/UTC errors.

Use pure black and a per-habit colour across names, units, checkboxes, numeric
values, and row rules. Habit details include an eight-colour picker. These choices
remain in memory until the incremental storage layer is implemented.

The founder has published the GitHub repository and authorised commits. Commit
local work in coherent changes; preview captures and environment settings remain
ignored. Selecting a licence is still an open project decision.

## 007 — Opt-in local preview sharing

Date: 4 October 2026. Status: requested by the founder; implemented.

Use `.env.local` to enable a development-only screenshot gesture. Native screen
capture supports the visible grid and dialogs; images are uploaded over the LAN
to a paired Node receiver and saved under ignored `.dev/previews/`. No capture
runs without an explicit long press (or accessibility action). Require both the env flag and React Native's `__DEV__` guard.
The release JS should contain no preview capture/upload module. This supports
fast visual feedback without requiring physical-iPhone MCP automation.

The founder requested that the capture control not interfere with the UI. The
visible buttons were replaced with long-press handlers on the existing app
heading and dialog titles. They render the same Text with unchanged styles;
success is communicated by haptics and a VoiceOver announcement, with no popup
or extra layout space. The receiver protocol and saved paths stay the same.

## 001 — React Native, Expo, and TypeScript

Date: 4 October 2026. Status: initial technical choice, revisitable.

The founder suggested React/Expo and develops on Linux with an iPhone available.
Use React Native with Expo for native UI and a cloud path to signed iOS builds.
TypeScript helps catch mistakes during development. Swift-only local development
would require access to Apple's Mac toolchain.

SDK 57 is the current stable npm `latest` checked during setup; SDK 58 has a
`next` tag. Use the stable SDK 57 template and lockfile. Recheck supported SDKs
and Apple's build requirements before beta/release.

## 002 — Small starter, npm, and local checks

Date: 4 October 2026. Status: implemented.

Use the blank TypeScript template, npm, TypeScript, ESLint, and Prettier. Node 24
is already installed. Keep a browser preview for Linux development. Avoid adding
routing, authentication, cloud databases, or state libraries before needed.

## 003 — Stable checkoff positions

Date: 4 October 2026. Status: implemented in demo; product rule confirmed.

Checking a row changes its state, not its position or dimensions. This follows
the founder's muscle-memory goal. The founder confirmed manual ordering, checkbox and numeric types, a three-day
grid, 10–20 habits, and an iPhone 16 Pro. Numeric entry primarily records a daily
total. Column direction, density, and scheduling remain open.

## 006 — Incremental storage and export

Date: 4 October 2026. Status: founder-confirmed direction; schema not implemented.

Store incremental app changes, use them as the full-fidelity export format, and
build a separate history feature over them. Daily habit records are a distinct
view. See STORAGE.md for the proposed log/projection approach and unresolved
format, deletion, date, and restoration semantics.

## 004 — Own the release path, defer account-specific configuration

Date: 4 October 2026. Status: planned.

Use Expo Go for the first phone experiment, then a development build and
TestFlight before App Store release. EAS configuration, bundle identifier, Apple
team, Expo project, and signing credentials are not fabricated in the starter.
Configure them when the founder's accounts and final identifiers are available.

## 005 — Licensing remains a founder decision

Date: 4 October 2026. Status: open.

Open source is confirmed; a particular licence is not. Preserve the generated
Expo template notice separately. Choose a project licence and copyright holder
before publishing the repository. Do not present Expo's copyright as ownership
of the new application.
