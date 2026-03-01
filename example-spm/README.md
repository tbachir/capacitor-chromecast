# Chromecast Plugin SPM Example

This folder contains a Capacitor example app configured for iOS Swift Package Manager (SPM) with `@strasberry/capacitor-chromecast`.

## Run in browser

```bash
cd example-spm
npm install
npm run dev
```

## Build + sync for native (SPM iOS)

```bash
cd example-spm
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

If iOS gets into a broken state, reset it:

```bash
npm run cap:reset:ios
npm run cap:open:ios
```

## iOS local network permissions

This example patches `ios/App/App/Info.plist` automatically after `cap:add:ios` and `cap:sync` to include:

- `NSLocalNetworkUsageDescription`
- `NSBonjourServices` with `_googlecast._tcp` and `_FB38EA42._googlecast._tcp`

If you use another receiver app ID, replace `_FB38EA42._googlecast._tcp` with your own service.

## Notes

- `cap:add:ios` uses `--packagemanager SPM`.
- `requestSession()` opens the Cast device picker.
- This example configures `plugins.Chromecast.appId` in `capacitor.config.json` (`FB38EA42`).
- On iOS, the first initialized `appId` is kept for the current app launch; restart the app after changing config.

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
