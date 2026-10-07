# Path to an open-source App Store release

This is a plan, not a declaration that the starter is ready to publish.
Requirements were checked on 4 October 2026; recheck before acting.

## 1. Validate on the phone

Start with Expo Go. Agree the initial product scope and establish the fast
checkoff interaction before investing in release infrastructure.

## 2. Create the project's own development build

### Release performance test before App Store setup

For a quick no-account comparison, use the paired Expo Go sessions described in
[DEVELOPMENT.md](DEVELOPMENT.md). They disable profiling/sample/motion tools and
compare development JS with production/minified JS. Expo Go's native host stays
the same, so this is not full release-build evidence.

`eas.json` now contains a `preview` profile with internal distribution,
`developmentClient: false` and explicit iOS `buildConfiguration: Release`.
It builds a standalone signed app with its JS bundled, without a development
server or public App Store submission. The developer-only tools/fictional history
remain excluded by `__DEV__`, and the profile also sets their flags false.
No cloud project, bundle identifier, Apple signing or device registration has
been configured yet; the profile is prepared, not an installable build.

On Linux, use [EAS internal distribution](https://docs.expo.dev/build/internal-distribution/)
after an active paid Apple Developer membership and Expo account are available.
Choose a provisional testing bundle identifier (the final brand remains open),
link the intended Expo project, sign in through the local EAS terminal and register
the iPhone before the first ad hoc build. Do not paste credentials into chat.
Review current EAS build quotas before starting the cloud job. No dev-client
dependency is needed for this Release preview. The manual commands after setup are:

```sh
npx eas-cli@latest device:create
npx eas-cli@latest build --platform ios --profile preview
```

Open the completed build's install link on the registered iPhone. Unlike Expo Go,
this app has its own storage container. Use a fictional backup in that container
to match the test list/history/appearance, or compare empty preset data in both
hosts. Do not compare a small empty Release list with a large populated dev list
and report the difference as a speedup. Preview build and signing are manual;
there is no automatic submission or deployment. See Expo's
[internal-build tutorial](https://docs.expo.dev/tutorial/eas/internal-distribution-builds/).

### Development build for daily work

Use an Expo account and Apple Developer Program membership for the EAS physical
iPhone signing workflow. Apple lists membership at US$99 per year, with regional
pricing shown during enrolment. EAS service quotas/pricing are separate; review
the current plan before scheduling cloud builds.

When accounts are ready, choose the stable iOS bundle identifier, link the correct
Expo project, and install `expo-dev-client` with `npx expo install`. Run EAS CLI
login and build configuration, then create development/internal-distribution and
production profiles alongside the prepared preview profile in `eas.json`. Register the physical device as directed by
EAS for an ad hoc development build. These account steps are not done yet.

After configuration, the typical commands are:

```sh
npx eas-cli@latest build --platform ios --profile development
npx expo start --dev-client
```

Those commands are future steps, not commands the current starter can complete
without credentials and build configuration. EAS builds iOS on hosted Macs;
local iOS compilation/simulation still requires macOS.

## 3. Test a production build through TestFlight

Complete native build configuration for the selected SDK and current Apple
requirements. In particular, SDK 57 has additional scene-lifecycle requirements
when built with Xcode 27; follow current Expo guidance or upgrade the SDK before
choosing that toolchain. Do not blindly pin a future EAS image.

After creating the App Store Connect app record and configuring production:

```sh
npx eas-cli@latest build --platform ios --profile production
npx eas-cli@latest submit --platform ios
```

EAS Submit uploads the build to App Store Connect/TestFlight. It does not itself
publish a public App Store release. Complete the beta tests in TESTING.md,
including real launch timing, persistence, upgrades, and accessibility.

## 4. Prepare the public release

- Finalise the name, icon, screenshots, supported devices, and iOS versions.
- Select the open-source licence/copyright holder and publish a repository with
  setup instructions, contribution guidance, and the required third-party notices.
- Decide pricing, support contact/URL, and data recovery expectations.
- Provide a privacy policy and accurate App Store privacy disclosures based on
  the app's actual code and dependencies. Re-evaluate if analytics or sync is added.
- Complete App Store metadata, age rating, export compliance, review information,
  and any applicable accessibility declarations using the current submission flow.
- Submit the selected build for App Review, resolve feedback, and release it.

## References

- [Apple Developer enrolment and cost](https://developer.apple.com/programs/enroll/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [Development builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [EAS Submit for iOS, including Linux support](https://docs.expo.dev/submit/ios/)
- [Expo SDK 57 and Xcode 27 notes](https://expo.dev/changelog/sdk-57)
