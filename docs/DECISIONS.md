# Decision log

## 016 — Visible bar, centred Today, and border pull feedback

Date: 4 October 2026. Status: founder chose always visible and compact; revised placement confirmed on phone; streak toned down after specific visual feedback, with final brightness acceptance pending.

The founder requested date, history, and settings controls and chose an
always-visible bar. After the first phone preview they liked the History/Settings
icons and their placement, but rejected moving the date into the bar and Today
into the table corner. They explicitly requested Today top-centre, the date back
in the first table row, and text-free future-pull feedback on the table divider.
They clarified this means the existing divider beneath the date headings, not
a newly added border. The streak should grow left while its right end stays fixed.

The final proposal keeps ONPURPOSE at left, reserves the centre for Today, and
keeps History/Settings at right. Month/year sits beside the day headings, with
the existing date menu. Three equal regions centre Today independent of the
unequal widths of branding and icon controls. Today appears when browsing away;
its space remains reserved. The founder confirmed this revised placement was right.

Replace pull text/progress with a gradient on that existing divider. Its right
endpoint stays fixed; width grows leftwards with pull distance, then fades at its
last width on release. There is no translation, repeating shimmer, or new border.
The founder reported a bright, sunlight-like hotspot and an uneven brightness
ramp. Remove the white peak and trailing dim stop; use a transparent-to-#8A8A8A
alpha ramp so brightness increases continuously toward the fixed right edge.
Keep the threshold haptic and smooth future reveal. Restore month and year as
separate, normally spaced text elements inside the date button.

History and Settings use closable native sheets. Keep the grid mounted and retain
its date position behind them. History is a clear placeholder; Settings supplies
a real haptic toggle for the current session. No persistent settings or history
are claimed. Durable incremental storage with undo is the founder’s requested
next step after the UI is settled, and remains separate work.

Use own SVG outlines via Expo-compatible react-native-svg, avoiding an icon font.
The development capture gesture works on ONPURPOSE, the month/year label, and
dialog/panel titles. Preserve its `__DEV__`/env gating.

## 015 — Continue the future pull without a screen jump

Date: 4 October 2026. Status: founder requested; implemented, founder confirmed the transition is smooth and intuitive on phone.

The founder found the four-day jump disorienting. The old implementation remounted
both lists whenever the future range changed and selected a full screen of future
dates as the new initial position. Remove that remount for expansion. Keep stable
date keys and preserve visible native content while inserting the next 30 dates.

Retain the deliberate 64-point pull-and-release and its single threshold haptic.
Use the released pull distance to choose the nearest whole date, with a minimum
of one new day; a normal pull shows tomorrow next to today in either orientation.
Once both lists have laid out the expanded content, animate the body to that
position and let its UI-thread handler synchronize the header. A new user drag
takes priority. This supersedes decision 010’s full-screen future positioning.

Return to Today still collapses and remounts the range explicitly. Rotation and
Today cancel pending reveal work. Menu access uses the same transition with one
new day beyond the existing edge. Native anchoring and motion need device testing;
automated offset tests alone cannot establish visual continuity. The founder
subsequently tested the new reveal and confirmed it was smooth and intuitive.
Second-batch, interruption, and rotation checks remain in the phone checklist.

## 014 — Restrained action haptics

Date: 4 October 2026. Status: requested by the founder; implemented, revised strength confirmed on phone.

Use the installed Expo Haptics library for immediate, single-pulse action feedback.
Completion/changed save uses Medium, undo/clear uses Soft, discrete selection uses
a selection tick, and the future-pull threshold uses Medium. These mappings are
assistant design choices to tune on the founder's iPhone. Avoid long success
patterns for ordinary checkoff; the development preview's success notification
remains a separate tool response.

Emit feedback only from accepted actions, outside React state updater functions.
Do not await native feedback before updating state. Catch unsupported/native failures;
visual confirmation stays authoritative. No-op saves, cancellations, ordinary
scrolling, typing, and continuous colour sliders are quiet. Future readiness ticks
once per direct drag at the threshold, with no duplicate on release or recrossing.
No new dependency, settings screen, or extra home controls are introduced.

The founder tried the first version and described it as slightly weak. Raise
completion/changed-save feedback from Light to Medium, keeping undo Soft and
selection ticks unchanged. The founder subsequently confirmed the revised feedback was good.

## 013 — Stronger and more consistent cell dimming

Date: 4 October 2026. Status: implemented after inspecting a founder phone preview.

The founder reported that the transition was still not obvious. Their screenshot
shows today beside tomorrow, where date text is dimmer but empty cells remain
similar in strength. The 0.5 lightness floor limited some presets much earlier:
Read's empty mark lost about 12% lightness, while Cook a meal lost about 24%.

Lower the empty-cell floor to 0.38 so all current presets reach the intended 30%
lightness reduction. Keep the separate 0.56 floor for date text. Preserve hue/chroma,
recorded-value emphasis, and the day 5–8 history interval. Arbitrary saturated
custom colours still stop at the sRGB boundary when necessary. This is an
adjustment to decision 012 based on actual phone appearance.

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
