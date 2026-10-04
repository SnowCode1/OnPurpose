# Path to an open-source App Store release

This is a plan, not a declaration that the starter is ready to publish.
Requirements were checked on 4 October 2026; recheck before acting.

## 1. Validate on the phone

Start with Expo Go. Agree the initial product scope and establish the fast
checkoff interaction before investing in release infrastructure.

## 2. Create the project's own development build

Use an Expo account and Apple Developer Program membership for the EAS physical
iPhone signing workflow. Apple lists membership at US$99 per year, with regional
pricing shown during enrolment. EAS service quotas/pricing are separate; review
the current plan before scheduling cloud builds.

When accounts are ready, choose the stable iOS bundle identifier, link the correct
Expo project, and install `expo-dev-client` with `npx expo install`. Run EAS CLI
login and build configuration, then create development/internal-distribution and
production profiles in `eas.json`. Register the physical device as directed by
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
