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
      // Optionnel (defaut: true) : auto initialize au chargement et au resume
      autoInitialize: true,
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

    // Si autoInitialize=true (defaut), cet appel n'est pas obligatoire.
    // Garde-le seulement si tu veux forcer des options runtime.
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

1. Laisser `autoInitialize: true` (defaut) pour init automatique au chargement et au `resume`.
2. `requestSession()` sur action utilisateur (bouton Cast).
3. `loadMedia()` ou `loadMediaWithHeaders()`.
4. controles (`mediaPlay`, `mediaPause`, `mediaSeek`, etc.).
5. `sessionLeave()` si tu veux laisser le receiver tourner.
6. `sessionStop()` si tu veux stopper la lecture cote receiver.

## 7. Notes importantes

- iOS: le SDK Cast garde le premier `appId` initialise pendant tout le cycle de vie de l'app. Pour changer d'`appId`, redemarre l'app.
- Android/iOS natif: l'`appId` peut venir de `capacitor.config.*` (`plugins.Chromecast.appId`).
- Avec `autoInitialize: true`, les appels plugin lancent automatiquement une init si necessaire.
- Si tu veux forcer des options runtime via `initialize(...)` (ex: `autoJoinPolicy`, `defaultActionPolicy` ou `appId`), soit initialise tres tot au bootstrap, soit mets `autoInitialize: false` et gere l'init manuellement.
- Web: certaines fonctions de scan/selection sont limitees par le SDK Cast web (picker navigateur).
- Toujours entourer les appels plugin avec `try/catch` et journaliser les erreurs plugin.

### Web prerequisites

- Web Sender supporte: Chrome desktop et Chrome Android.
- Web Sender non supporte sur iOS browser/WKWebView.
- Utiliser HTTPS, ou `http://localhost` / `http://127.0.0.1` en local.
- Appeler `requestSession()` uniquement suite a une action utilisateur (click/tap).
- Si `cast_sender.js` se charge dans une app Capacitor iOS/Android, le plugin natif n'est probablement pas charge (verifier `npx cap sync` + rebuild natif).

## 8. Check de sante rapide

```ts
const net = await Chromecast.networkDiagnostic();
console.log(net);
```

Tu peux verifier notamment:
- `networkConnected`
- `isWiFi`
- `castConnectionAvailable`

## 9. Service global pour Ionic Angular standalone

Si ton app est en Angular standalone, tu peux partir de ce service injectable:

- [`examples/angular-ionic-standalone/chromecast.service.ts`](./examples/angular-ionic-standalone/chromecast.service.ts)

Points clefs:
- `@Injectable({ providedIn: 'root' })` pour etre disponible partout.
- `state` en **Signal** (Angular moderne) + `state$` pour interop RxJS.
- selecteurs `computed` (`session`, `receiverAvailable`, etc.) prets pour le template.
- listeners plugin centralises dans le service.

Exemple d'utilisation dans un composant standalone:

```ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonButton } from '@ionic/angular/standalone';
import { ChromecastService } from './services/chromecast.service';

@Component({
  selector: 'app-cast-demo',
  standalone: true,
  imports: [CommonModule, IonButton],
  template: `
    <ion-button (click)="start()">Caster une video</ion-button>
    @if (cast.session(); as session) {
      <p>Session active: {{ session.receiver.friendlyName }}</p>
    }
  `,
})
export class CastDemoComponent {
  readonly cast = inject(ChromecastService);

  async start(): Promise<void> {
    await this.cast.requestSession();
    await this.cast.loadMedia({
      contentId:
        'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      contentType: 'video/mp4',
      streamType: 'BUFFERED',
      autoPlay: true,
      currentTime: 0,
    });
  }
}
```
