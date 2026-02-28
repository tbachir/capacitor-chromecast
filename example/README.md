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

`cap:add:ios` now forces CocoaPods and applies an iOS 15 target fix automatically.

Then open the platform project:

```bash
npm run cap:open:ios
# or
npm run cap:open:android
```

If a platform is already added, `cap:add:*` can be skipped.

If iOS gets into a broken state (for example: `ios platform already exists` but `ios/App/Podfile` is missing), reset it:

```bash
npm run cap:reset:ios
npm run cap:open:ios
```

## Notes

- On web, route scanning is limited by the Google Cast Web SDK.
- `requestSession()` opens the cast device picker.
- Use a valid Cast `appId` for custom receivers, or leave empty for default receiver.
- On iOS, `appId` is fixed after the first `initialize()` of the current app launch. Restart the app to switch to another receiver `appId`.
- This plugin uses an iOS `.podspec`, so CocoaPods is required for iOS integration.
- The example iOS app includes `NSLocalNetworkUsageDescription` and `NSBonjourServices` (`_googlecast._tcp`, `_CC1AD845._googlecast._tcp`) in `Info.plist` for Cast discovery.
- If you use a custom receiver app ID, replace `CC1AD845` in `Info.plist` with your own app ID.
