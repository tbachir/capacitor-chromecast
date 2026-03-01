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
- This example configures `plugins.Chromecast.appId` in `capacitor.config.json` (`FB38EA42`).
- On iOS, `appId` is fixed after the first `initialize()` of the current app launch. Restart the app after changing config.
- This specific example uses CocoaPods for iOS. For SPM iOS integration, use [`../example-spm`](../example-spm).
- The example iOS app includes `NSLocalNetworkUsageDescription` and `NSBonjourServices` (`_googlecast._tcp`, `_FB38EA42._googlecast._tcp`) in `Info.plist` for Cast discovery.
- If you use a custom receiver app ID, replace `FB38EA42` in `Info.plist` with your own app ID.

## MimeIt demo flow (`cast.mimeit.com`)

The example UI includes a ready-to-use MimeIt demo section with:

- Namespace preset: `urn:x-cast:com.mimeit.state`
- Demo message buttons for `RESET`, `HEARTBEAT`, and `SYNC_STATE` scenes (`IDLE`, `NEXT_PLAYER`, `TURN_RUNNING`, `GAME_RESULTS`)
- One-click sequence button: `Run MimeIt Demo Sequence`

Quick test sequence:

1. Open the app and click `Apply MimeIt Preset`.
2. Click `Initialize`.
3. Click `Request Session` and pick your Chromecast device.
4. Click `Add Listener` (optional, to receive ACK messages/events).
5. Click `Run MimeIt Demo Sequence` for an automatic full flow, or use scene buttons manually.
