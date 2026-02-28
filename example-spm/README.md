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

For Cast discovery, add these keys in `ios/App/App/Info.plist`:

- `NSLocalNetworkUsageDescription`
- `NSBonjourServices` with `_googlecast._tcp` and your receiver service `_CC1AD845._googlecast._tcp`

## Notes

- `cap:add:ios` uses `--packagemanager SPM`.
- `requestSession()` opens the Cast device picker.
- On iOS, the first initialized `appId` is kept for the current app launch; restart the app to switch `appId`.
