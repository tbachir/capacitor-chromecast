# Chromecast Plugin Real Example

This folder contains a real Capacitor example app using `@strasberry/capacitor-chromecast`.

## What is included

- A Vite web app (`src/`) built to `www/` for Capacitor
- Controls for initialization, scan/session, media control, diagnostics
- Live event log for plugin events (`SESSION_STARTED`, `SESSION_ENDED`, `RECEIVER_MESSAGE`, etc.)

## Run in browser

```bash
cd example
npm install
npm run dev
```

## Build + sync for native

```bash
cd example
npm install
npm run cap:add:ios
npm run cap:add:android
npm run cap:sync
```

Then open the platform project:

```bash
npm run cap:open:ios
# or
npm run cap:open:android
```

If a platform is already added, `cap:add:*` can be skipped.

## Notes

- On web, route scanning is limited by the Google Cast Web SDK.
- `requestSession()` opens the cast device picker.
- Use a valid Cast `appId` for custom receivers, or leave empty for default receiver.
