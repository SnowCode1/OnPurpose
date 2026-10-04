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
   numeric cell to enter a daily total. Names open a statistics placeholder.
   This demo does not save; entries and colours reset on reload. The founder
   requested removal of the bottom demo notice to give the grid more space.
7. Edit `App.tsx` and save. The phone should refresh with the change.

The founder confirmed the app opens on the iPhone 16 Pro. Its exact iOS version
and detailed runtime/accessibility checks remain to be recorded.

## Commands

| Command                | Use                                                 |
| ---------------------- | --------------------------------------------------- |
| `npm start`            | Start Expo Go development over the local network    |
| `npm run start:clear`  | Restart with a cleared Metro cache                  |
| `npm run start:tunnel` | Try a tunnel if Wi-Fi isolation blocks local access |
| `npm run web`          | Browser preview for convenient Linux layout work    |
| `npm run typecheck`    | TypeScript checks                                   |
| `npm run lint`         | ESLint checks                                       |
| `npm run format`       | Format source and docs                              |
| `npm run check`        | All local static checks                             |
| `npm run doctor`       | Expo's environment/dependency diagnostics           |
| `npm run export:ios`   | Compile/export iOS JavaScript and assets locally    |

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
app when you long-press the existing app heading or a dialog title, then uploads
a PNG to a receiver on your
computer. The receiver writes `.dev/previews/latest.png` and a dated copy. An
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
7. Touch and hold **ONPURPOSE** for about half a second.
   Inside a dialog, hold its title instead. A success haptic fires only after
   the receiver confirms the save. Upload errors are shown and can be retried.
   There is no preview button, added layout space, success popup, or pressed style.
   VoiceOver users can choose the heading’s **Share preview** accessibility action;
   successful uploads are announced. If iOS disables haptics (for example in Low
   Power Mode), check the receiver log or latest image to confirm the save.

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
Share both orientations using the same long press on ONPURPOSE. Test numeric
entry with the keyboard open in landscape as well as the main grid.

## Animation and colour controls

Reanimated/Worklets, the community Slider, and Expo LinearGradient are installed
with SDK-compatible versions for Expo Go. Reanimated's Babel plugin is supplied
by `babel-preset-expo`; no custom Babel configuration is needed. Restart Metro
with `npm run start:clear` and fully reload Expo Go after adding these libraries
so cached transforms do not retain the previous configuration.

[Expo Reanimated setup](https://docs.expo.dev/versions/v57.0.0/sdk/reanimated/)
and [UI-thread scroll synchronization](https://docs.swmansion.com/react-native-reanimated/docs/scroll/scrollTo/).
