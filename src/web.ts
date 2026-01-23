import { WebPlugin } from '@capacitor/core';

import type {
  ChromecastPlugin,
  InitializeOptions,
  LoadMediaOptions,
  LoadMediaWithHeadersOptions,
  MediaObject,
  NetworkDiagnosticResult,
  RouteInfo,
  SendMessageResult,
  SessionObject,
} from './definitions';

declare global {
  interface Window {
    __onGCastApiAvailable: (isAvailable: boolean) => void;
    chrome: any;
  }
}

export class ChromecastWeb
  extends WebPlugin
  implements Omit<ChromecastPlugin, 'addListener'> {
  private cast: any;
  private session: any;

  async initialize(options?: InitializeOptions): Promise<void> {
    const script = document.createElement('script');
    script.setAttribute('type', 'text/javascript');
    script.setAttribute(
      'src',
      'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1',
    );
    document.body.appendChild(script);

    return new Promise((resolve, reject) => {
      window.__onGCastApiAvailable = (isAvailable: boolean) => {
        if (isAvailable) {
          this.cast = window.chrome.cast;
          const sessionRequest = new this.cast.SessionRequest(
            options?.appId || this.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
          );

          const apiConfig = new this.cast.ApiConfig(
            sessionRequest,
            () => {
              // Session listener
            },
            () => {
              // Receiver listener
            },
          );
          this.cast.initialize(
            apiConfig,
            () => resolve(),
            (err: any) => reject(err),
          );
        } else {
          reject(new Error('Cast API not available'));
        }
      };
    });
  }

  async requestSession(): Promise<SessionObject> {
    return new Promise((resolve, reject) => {
      this.cast.requestSession(
        (session: any) => {
          this.session = session;
          resolve(this.createSessionObject(session));
        },
        (err: any) => reject(err),
      );
    });
  }

  async launchMedia(options: {
    mediaUrl: string;
  }): Promise<{ success: boolean }> {
    if (!this.session) {
      throw new Error('No active session');
    }

    const mediaInfo = new this.cast.media.MediaInfo(options.mediaUrl);
    const request = new this.cast.media.LoadRequest(mediaInfo);

    return new Promise((resolve, reject) => {
      this.session.loadMedia(
        request,
        () => resolve({ success: true }),
        (err: any) => reject(err),
      );
    });
  }

  async loadMedia(_options: LoadMediaOptions): Promise<MediaObject> {
    throw new Error('Web implementation not available');
  }

  async loadMediaWithHeaders(
    _options: LoadMediaWithHeadersOptions,
  ): Promise<MediaObject> {
    throw new Error('Web implementation not available');
  }

  async mediaPause(): Promise<void> {
    throw new Error('Web implementation not available');
  }

  async mediaPlay(): Promise<void> {
    throw new Error('Web implementation not available');
  }

  async mediaSeek(_options: { currentTime: number }): Promise<void> {
    throw new Error('Web implementation not available');
  }

  async mediaNext(): Promise<void> {
    throw new Error('Web implementation not available');
  }

  async mediaPrev(): Promise<void> {
    throw new Error('Web implementation not available');
  }

  async sessionStop(): Promise<void> {
    if (this.session) {
      this.session.stop();
      this.session = null;
    }
  }

  async sessionLeave(): Promise<void> {
    if (this.session) {
      this.session.leave();
      this.session = null;
    }
  }

  async startRouteScan(_options?: {
    timeout?: number;
  }): Promise<{ routes: RouteInfo[] }> {
    throw new Error('Web implementation not available');
  }

  async stopRouteScan(): Promise<void> {
    throw new Error('Web implementation not available');
  }

  async selectRoute(_options: { routeId: string }): Promise<SessionObject> {
    throw new Error('Web implementation not available');
  }

  async sendMessage(_options: {
    namespace: string;
    message: string;
  }): Promise<SendMessageResult> {
    throw new Error('Web implementation not available');
  }

  async addMessageListener(_options: { namespace: string }): Promise<void> {
    throw new Error('Web implementation not available');
  }

  async networkDiagnostic(): Promise<NetworkDiagnosticResult> {
    return {
      networkConnected: navigator.onLine,
      networkType: 'unknown',
      isWiFi: true,
      castConnectionAvailable: !!this.cast,
    };
  }

  private createSessionObject(session: any): SessionObject {
    return {
      appId: session.appId || '',
      sessionId: session.sessionId || '',
      receiver: {
        friendlyName: session.receiver?.friendlyName || '',
        label: session.receiver?.label || '',
        volume: {
          level: session.receiver?.volume?.level || 0,
          muted: session.receiver?.volume?.muted || false,
        },
      },
      media: [],
    };
  }
}
