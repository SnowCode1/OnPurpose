# Decision log

## 012 — Dim by lightness without desaturating

Date: 4 October 2026. Status: founder requested correction; implemented.

The founder rejected the desaturated treatment in decision 011. Preserve hue and
chroma and lower only OKLCH lightness. Fade earlier and faster: the assistant's
new interval starts on day 5 and finishes on day 8. Future empty cells use the
full dimming amount immediately. Recorded values and their date headings retain
normal emphasis.

Use a nonzero lightness floor (0.5 for empty cells, 0.56 for date text). Do not
brighten an already-darker custom colour. If lowering lightness at fixed hue/chroma
would leave sRGB, stop at its gamut boundary instead of reducing chroma. These
lightness limits and the day-8 endpoint are implementation choices to judge on
phone. This supersedes decision 011's chroma reduction and days 8–14 interval.

## 011 — Muted future and older empty cells

Date: 4 October 2026. Status: implemented; visual phone confirmation pending.

The founder wants future dates and entries muted unless recorded, and suggested
similar treatment beyond seven days. They clarified that muting can use OKLCH
and should not require greyscale. Keep each habit's hue while reducing chroma and
lightness. Checked boxes and entered numeric totals (including zero) retain the
selected colour. A date heading returns to normal brightness when any habit has
a recorded value for that date.

The assistant proposes a smooth transition beginning after day 7 and reaching
its maximum at day 14. Fade by calendar age so a date looks consistent regardless
of screen position, orientation, and column count. Bound the fade rather than
continuing to darken distant history. Keep controls active and accessibility
state independent of visual emphasis. This treatment is a phone experiment to
refine with founder feedback.

The founder confirmed scrolling and the colour dialog's Done/close behaviour
work correctly on the phone before this visual change.

## 010 — Smooth scrolling, deliberate future access, and custom colours

Date: 4 October 2026. Status: implemented; founder confirmed smoother scrolling and working future pull.

The founder reported jitter while side-scrolling. Replace JavaScript per-frame
synchronization/state updates with Reanimated UI-thread scroll handlers and send
only settled dates back to React. Install SDK-compatible Reanimated/Worklets;
use native sliders and gradient tracks for colour controls.

The founder now wants future browsing with extra scrolling effort and explicitly
confirmed future entries should be allowed. This supersedes decision 008's
past-only limit. Start at today, require a resisted 64-point pull and release,
then reveal future dates in batches of 30. The month menu supplies an explicit
alternative. Today collapses future columns and restores the boundary while
preserving recorded values. Threshold and batch size are implementation choices
to tune with phone feedback. Future values' treatment in streaks remains a
statistics-design question; statistics are not implemented.

Provide 24 curated colours plus optional custom controls and hex. Use OKLCH
internally, with plain Hue/Colourfulness/Lightness labels and sRGB hex storage.
Offer a contrast hint on black, and preserve exact valid hex choices. Keep the
existing system font pending a deliberate typography comparison.

The founder found the first stacked picker too tall. Use Presets/Custom tabs and
one fixed Done action. The founder explicitly requested Done to apply and close,
and a separate close button to discard changes. All colour selection stays a draft
until Done, including preset choices; there is no additional apply button.

## 009 — Adaptive density and landscape

Date: 4 October 2026. Status: requested by the founder; implemented; founder confirmed both orientations work and stay aligned.

Replace the fixed three-column layout with as many complete dates as the measured
width and system text size can comfortably fit. Enable landscape and use the
extra width for dates; retain safe areas, fixed habit names, and past-only bounds.
Keep the rightmost visible date when rotating. Day touch targets are at least
48 points wide at normal text size, growing with larger text.

The founder questioned the redundant date header. This polish pass keeps a
compact month/year beside the date headings and removes the separate large date
range. This visual treatment is an assistant proposal to evaluate on the phone.
Today remains subtly highlighted; the return action appears only in history,
without moving any rows. Reduce excess vertical space and soften row rules while
retaining colour across habit names, checkboxes, and numeric entries.

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
