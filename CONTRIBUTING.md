# Contributing

This project is in discovery and foundation setup. Read PROJECT_GOALS.md first.
The founder's priority is quick, reliable, familiar-position habit checkoff.
Discuss changes that expand product scope before building them.

Use Node 24 and npm. Run `npm ci`, make a focused change, and run `npm run check`.
Use `npm run export:ios` for native-facing changes and document any phone checks.
For PRs, explain the user-visible problem, the resulting behaviour, and how it
was verified. Include a screenshot or recording when it helps assess UI changes.

Update docs with setup or behaviour changes. Keep demo data separate from real
user data. Never commit credentials, signing keys, or tokens. The project is
GPLv3 with a single copyright holder so the founder can publish it on the App
Store. Contributions need an agreement that preserves this; ask before opening
a substantial pull request.
