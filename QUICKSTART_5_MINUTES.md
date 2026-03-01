# Quickstart (5 minutes)

Objectif: caster une video en quelques minutes avec `@strasberry/capacitor-chromecast`.

## 1) Installer

```bash
npm install @strasberry/capacitor-chromecast
npx cap sync
```

## 2) Configurer l'appId Chromecast

Dans `capacitor.config.ts`:

```ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: 'MyApp',
  webDir: 'dist',
  plugins: {
    Chromecast: {
      appId: 'CC1AD845', // Receiver par defaut Google
    },
  },
};

export default config;
```

Puis:

```bash
npx cap sync
```

## 3) iOS uniquement: permissions reseau local

Dans `Info.plist`:

```xml
<key>NSLocalNetworkUsageDescription</key>
<string>Chromecast discovery requires local network access.</string>
<key>NSBonjourServices</key>
<array>
  <string>_googlecast._tcp</string>
  <string>_CC1AD845._googlecast._tcp</string>
</array>
```

## 4) Code minimum

```ts
import { Chromecast } from '@strasberry/capacitor-chromecast';

export async function startCastDemo() {
  await Chromecast.initialize({
    autoJoinPolicy: 'origin_scoped',
    defaultActionPolicy: 'create_session',
  });

  await Chromecast.requestSession();

  await Chromecast.loadMedia({
    contentId:
      'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    contentType: 'video/mp4',
    streamType: 'BUFFERED',
    autoPlay: true,
    currentTime: 0,
    metadata: {
      title: 'Big Buck Bunny',
      subtitle: 'Quickstart Chromecast',
    },
  });
}
```

## 5) Lancer

1. Ouvre ton app.
2. Appelle `startCastDemo()` sur un bouton.
3. Choisis un device dans le picker Cast.

## 6) Controles utiles

```ts
await Chromecast.mediaPause();
await Chromecast.mediaPlay();
await Chromecast.mediaSeek({ currentTime: 30 });
await Chromecast.sessionLeave(); // laisse le receiver jouer
await Chromecast.sessionStop(); // stoppe le cast
```

## 7) Si ca ne marche pas

```ts
const diag = await Chromecast.networkDiagnostic();
console.log(diag);
```

Verifier en priorite:
- `networkConnected: true`
- `isWiFi: true`
- `castConnectionAvailable: true`

Pour plus de details, voir [GUIDE_UTILISATION.md](./GUIDE_UTILISATION.md).

