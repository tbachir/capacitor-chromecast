# @strasberry/capacitor-chromecast

Plugin Capacitor pour Chromecast sur iOS et Android.
Fork de [hauxir/capacitor-chromecast](https://github.com/hauxir/capacitor-chromecast).

## Install

```bash
npm install @strasberry/capacitor-chromecast
npx cap sync
```

## Configuration

Dans `capacitor.config.ts` :

```ts
/// <reference types="@capacitor/cli" />
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  plugins: {
    Chromecast: {
      appId: 'CC1AD845',       // Receiver ID (défaut Google: CC1AD845)
      autoInitialize: true,    // Optionnel, défaut: true
    },
  },
};
export default config;
```

Ordre de priorité pour `appId` : `initialize({ appId })` > `plugins.Chromecast.appId` > `CC1AD845`

Avec `autoInitialize: true` (défaut), le plugin s'initialise automatiquement au chargement et au `resume`.

## Web prerequisites (Google Cast Web Sender)

Pour l'utilisation web (`ionic serve`, PWA, navigateur):

- Navigateurs supportés: Chrome desktop et Chrome Android.
- Non supporté: iOS browser/WKWebView pour le Web Sender.
- Contexte sécurisé requis: HTTPS, ou `http://localhost` / `http://127.0.0.1`.
- `requestSession()` doit être appelé sur une action utilisateur (click/tap).
- Si tu vois `cast_sender.js` dans une app Capacitor iOS/Android, c'est généralement un fallback web non voulu: vérifie `npx cap sync` puis rebuild natif.

## iOS — Permissions réseau local (obligatoire)

Dans `Info.plist` de l'app iOS :

```xml
<key>NSLocalNetworkUsageDescription</key>
<string>Chromecast discovery requires access to devices on your local network.</string>
<key>NSBonjourServices</key>
<array>
  <string>_googlecast._tcp</string>
  <string>_CC1AD845._googlecast._tcp</string>
</array>
```

Remplace `CC1AD845` par ton `appId` si tu utilises un receiver custom.

> **Note iOS :** Le SDK Cast garde le premier `appId` initialisé pour tout le cycle de vie de l'app. Pour tester un autre `appId`, redémarre l'app.

## iOS : CocoaPods vs SPM

Par défaut : CocoaPods via `npx cap sync`.
SPM : le package livre un `Package.swift` — voir [docs/QUICKSTART.md](./docs/QUICKSTART.md).

## Documentation

| Document | Description |
|---|---|
| [docs/QUICKSTART.md](./docs/QUICKSTART.md) | Démarrage rapide (5 min) |
| [docs/GUIDE.md](./docs/GUIDE.md) | Guide complet avec exemples TypeScript production |
| [docs/API.md](./docs/API.md) | Référence API complète (auto-générée) |
| [docs/examples/angular-ionic-standalone/](./docs/examples/angular-ionic-standalone/) | Service Angular standalone avec Signals |

## Exemples d'applications

- CocoaPods : [example/](./example) — voir [example/README.md](./example/README.md)
- SPM : [example-spm/](./example-spm) — voir [example-spm/README.md](./example-spm/README.md)

## Contributing

Voir [CONTRIBUTING.md](./CONTRIBUTING.md). Mainteneurs : voir la section [Publishing](./CONTRIBUTING.md#publishing).
