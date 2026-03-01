# Guide d'utilisation du plugin Chromecast

Ce guide montre une integration reelle de `@strasberry/capacitor-chromecast` avec des exemples executables.

## 1. Installation

```bash
npm install @strasberry/capacitor-chromecast
npx cap sync
```

## 2. Configuration recommandee (`capacitor.config.ts`)

Le plugin lit `plugins.Chromecast.appId`.

```ts
/// <reference types="@capacitor/cli" />

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: 'MyApp',
  webDir: 'dist',
  plugins: {
    Chromecast: {
      // Receiver ID de ton app Cast, ou supprime cette ligne
      // pour utiliser le receiver par defaut (CC1AD845)
      appId: 'FB38EA42',
    },
  },
};

export default config;
```

## 3. Permissions iOS (obligatoire pour la decouverte)

Dans `Info.plist` de l'app iOS:

```xml
<key>NSLocalNetworkUsageDescription</key>
<string>Chromecast discovery requires access to local network devices.</string>
<key>NSBonjourServices</key>
<array>
  <string>_googlecast._tcp</string>
  <string>_FB38EA42._googlecast._tcp</string>
</array>
```

Remplace `FB38EA42` par ton `appId` si tu utilises un receiver custom.

## 4. Service TypeScript complet (exemple reel)

```ts
import { Chromecast } from '@strasberry/capacitor-chromecast';
import type {
  LoadMediaOptions,
  LoadMediaWithHeadersOptions,
  RouteInfo,
  SessionObject,
} from '@strasberry/capacitor-chromecast';

export class ChromecastService {
  private listenersBound = false;

  async init(): Promise<void> {
    if (!this.listenersBound) {
      await this.bindListeners();
      this.listenersBound = true;
    }

    // appId est pris depuis capacitor.config.*
    await Chromecast.initialize({
      autoJoinPolicy: 'origin_scoped',
      defaultActionPolicy: 'create_session',
    });
  }

  async requestSession(): Promise<SessionObject> {
    return Chromecast.requestSession();
  }

  async scanRoutes(timeout = 8): Promise<RouteInfo[]> {
    const { routes } = await Chromecast.startRouteScan({ timeout });
    return routes;
  }

  async selectRoute(routeId: string): Promise<SessionObject> {
    return Chromecast.selectRoute({ routeId });
  }

  async playMp4(url: string): Promise<void> {
    const options: LoadMediaOptions = {
      contentId: url,
      contentType: 'video/mp4',
      streamType: 'BUFFERED',
      autoPlay: true,
      currentTime: 0,
      metadata: {
        title: 'Demo Video',
        subtitle: 'Lecture Chromecast',
      },
    };

    await Chromecast.loadMedia(options);
  }

  async playProtectedHls(url: string, token: string): Promise<void> {
    const options: LoadMediaWithHeadersOptions = {
      contentId: url,
      contentType: 'application/x-mpegURL',
      streamType: 'LIVE',
      autoPlay: true,
      authHeaders: {
        Authorization: `Bearer ${token}`,
      },
    };

    await Chromecast.loadMediaWithHeaders(options);
  }

  async sendReceiverMessage(namespace: string, payload: unknown): Promise<void> {
    await Chromecast.addMessageListener({ namespace });

    const result = await Chromecast.sendMessage({
      namespace,
      message: JSON.stringify(payload),
    });

    if (!result.success) {
      throw new Error(result.error || 'Echec sendMessage');
    }
  }

  async removeReceiverMessageListener(namespace: string): Promise<void> {
    await Chromecast.removeMessageListener({ namespace });
  }

  async pause(): Promise<void> {
    await Chromecast.mediaPause();
  }

  async resume(): Promise<void> {
    await Chromecast.mediaPlay();
  }

  async seek(seconds: number): Promise<void> {
    await Chromecast.mediaSeek({ currentTime: seconds });
  }

  async next(): Promise<void> {
    await Chromecast.mediaNext();
  }

  async prev(): Promise<void> {
    await Chromecast.mediaPrev();
  }

  async leave(): Promise<void> {
    await Chromecast.sessionLeave();
  }

  async stop(): Promise<void> {
    await Chromecast.sessionStop();
  }

  async diagnostic() {
    return Chromecast.networkDiagnostic();
  }

  private async bindListeners(): Promise<void> {
    await Chromecast.addListener('SESSION_STARTED', payload => {
      console.log('[Cast] SESSION_STARTED', payload);
    });

    await Chromecast.addListener('SESSION_ENDED', payload => {
      console.log('[Cast] SESSION_ENDED', payload);
    });

    await Chromecast.addListener('MEDIA_UPDATE', payload => {
      console.log('[Cast] MEDIA_UPDATE', payload);
    });

    await Chromecast.addListener('RECEIVER_LISTENER', payload => {
      // payload contient `available` et `isAvailable`
      const isAvailable = payload.available ?? payload.isAvailable;
      console.log('[Cast] RECEIVER_LISTENER', { isAvailable });
    });

    await Chromecast.addListener('RECEIVER_MESSAGE', payload => {
      console.log('[Cast] RECEIVER_MESSAGE', payload);
    });
  }
}
```

## 5. Exemple d'utilisation dans un ecran

```ts
const cast = new ChromecastService();

async function startCasting() {
  try {
    await cast.init();
    await cast.requestSession();
    await cast.playMp4(
      'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    );
  } catch (e) {
    console.error('Erreur cast', e);
  }
}

async function sendStateToReceiver() {
  await cast.sendReceiverMessage('urn:x-cast:com.mimeit.state', {
    type: 'SYNC_STATE',
    version: '1',
    payload: {
      scene: 'IDLE',
      payload: { appName: 'Mime It' },
    },
  });
}
```

## 6. Flux minimum recommande en production

1. `initialize()` au lancement (apres bootstrap app).
2. `requestSession()` sur action utilisateur (bouton Cast).
3. `loadMedia()` ou `loadMediaWithHeaders()`.
4. controles (`mediaPlay`, `mediaPause`, `mediaSeek`, etc.).
5. `sessionLeave()` si tu veux laisser le receiver tourner.
6. `sessionStop()` si tu veux stopper la lecture cote receiver.

## 7. Notes importantes

- iOS: le SDK Cast garde le premier `appId` initialise pendant tout le cycle de vie de l'app. Pour changer d'`appId`, redemarre l'app.
- Android/iOS natif: l'`appId` peut venir de `capacitor.config.*` (`plugins.Chromecast.appId`).
- Web: certaines fonctions de scan/selection sont limitees par le SDK Cast web (picker navigateur).
- Toujours entourer les appels plugin avec `try/catch` et journaliser les erreurs plugin.

## 8. Check de sante rapide

```ts
const net = await Chromecast.networkDiagnostic();
console.log(net);
```

Tu peux verifier notamment:
- `networkConnected`
- `isWiFi`
- `castConnectionAvailable`

