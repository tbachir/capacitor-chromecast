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
    cast: {
      framework: {
        CastContext: {
          getInstance(): CastContext;
        };
        CastContextEventType: {
          CAST_STATE_CHANGED: string;
          SESSION_STATE_CHANGED: string;
        };
        CastState: {
          NO_DEVICES_AVAILABLE: string;
          NOT_CONNECTED: string;
          CONNECTING: string;
          CONNECTED: string;
        };
        SessionState: {
          SESSION_STARTED: string;
          SESSION_RESUMED: string;
          SESSION_ENDED: string;
          SESSION_ENDING: string;
        };
      };
    };
    chrome: {
      cast: {
        AutoJoinPolicy: {
          TAB_AND_ORIGIN_SCOPED: string;
          ORIGIN_SCOPED: string;
          PAGE_SCOPED: string;
        };
      };
    };
  }

  interface CastContext {
    setOptions(options: {
      receiverApplicationId: string;
      autoJoinPolicy: string;
    }): void;
    getCastState(): string;
    getCurrentSession(): CastSession | null;
    requestSession(): Promise<void>;
    endCurrentSession(stopCasting: boolean): void;
    addEventListener(
      type: string,
      handler: (event: CastStateEvent | SessionStateEvent) => void,
    ): void;
  }

  interface CastSession {
    getSessionId(): string;
    getApplicationMetadata(): { applicationId: string; name: string } | null;
    getCastDevice(): {
      friendlyName: string;
      label: string;
    } | null;
    getVolume(): number;
    isMute(): boolean;
    sendMessage(namespace: string, message: unknown): Promise<void>;
    addMessageListener(
      namespace: string,
      listener: (namespace: string, message: string) => void,
    ): void;
    removeMessageListener(
      namespace: string,
      listener: (namespace: string, message: string) => void,
    ): void;
  }

  interface CastStateEvent {
    castState: string;
  }

  interface SessionStateEvent {
    sessionState: string;
  }
}

export class ChromecastWeb
  extends WebPlugin
  implements Omit<ChromecastPlugin, 'addListener'> {
  private context: CastContext | null = null;
  private messageListeners: Map<
    string,
    (namespace: string, message: string) => void
  > = new Map();
  private appId: string = '';
  private contextSetup: boolean = false;

  async initialize(options?: InitializeOptions): Promise<void> {
    // Check if already loaded
    if (window.cast?.framework) {
      this.setupCastContext(options);
      return;
    }

    const script = document.createElement('script');
    script.setAttribute('type', 'text/javascript');
    script.setAttribute(
      'src',
      'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1',
    );
    document.body.appendChild(script);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Cast SDK load timeout'));
      }, 10000);

      window.__onGCastApiAvailable = (isAvailable: boolean) => {
        clearTimeout(timeout);
        if (isAvailable) {
          // Wait for framework to be fully ready
          const checkInterval = setInterval(() => {
            if (window.cast?.framework && window.chrome?.cast) {
              clearInterval(checkInterval);
              this.setupCastContext(options);
              resolve();
            }
          }, 100);

          setTimeout(() => {
            clearInterval(checkInterval);
            if (window.cast?.framework) {
              this.setupCastContext(options);
              resolve();
            } else {
              reject(new Error('Cast framework not available'));
            }
          }, 5000);
        } else {
          reject(new Error('Cast API not available'));
        }
      };
    });
  }

  private setupCastContext(options?: InitializeOptions): void {
    // Guard against multiple setupCastContext calls
    if (this.contextSetup) {
      return;
    }
    this.contextSetup = true;

    const context = window.cast.framework.CastContext.getInstance();
    this.context = context;
    this.appId = options?.appId || '';

    const autoJoinPolicyMap: Record<string, string> = {
      tab_and_origin_scoped:
        window.chrome.cast.AutoJoinPolicy.TAB_AND_ORIGIN_SCOPED,
      origin_scoped: window.chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
      page_scoped: window.chrome.cast.AutoJoinPolicy.PAGE_SCOPED,
    };

    context.setOptions({
      receiverApplicationId: this.appId,
      autoJoinPolicy:
        autoJoinPolicyMap[options?.autoJoinPolicy || 'origin_scoped'] ||
        window.chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
    });

    // Listen for cast state changes (receiver availability)
    const { CastState } = window.cast.framework;
    context.addEventListener(
      window.cast.framework.CastContextEventType.CAST_STATE_CHANGED,
      (event: CastStateEvent | SessionStateEvent) => {
        const castEvent = event as CastStateEvent;
        const available =
          castEvent.castState !== CastState.NO_DEVICES_AVAILABLE;
        this.notifyListeners('RECEIVER_LISTENER', { available });
      },
    );

    // Listen for session state changes
    const { SessionState } = window.cast.framework;
    context.addEventListener(
      window.cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
      (event: CastStateEvent | SessionStateEvent) => {
        const sessionEvent = event as SessionStateEvent;
        const session = context.getCurrentSession();

        if (sessionEvent.sessionState === SessionState.SESSION_STARTED) {
          // Attach message listeners BEFORE notifying about session start
          this.setupMessageListenersForSession(session);
          const sessionData = {
            session: session ? this.createSessionObject(session) : null,
          };
          // Use retainUntilConsumed to queue event if React is re-rendering and temporarily has no listeners
          this.notifyListeners('SESSION_STARTED', sessionData, true);
        } else if (sessionEvent.sessionState === SessionState.SESSION_RESUMED) {
          // Attach message listeners BEFORE notifying about session resume
          this.setupMessageListenersForSession(session);
          const sessionData = {
            session: session ? this.createSessionObject(session) : null,
          };
          this.notifyListeners('SESSION_RESUMED', sessionData, true);
        } else if (
          sessionEvent.sessionState === SessionState.SESSION_ENDED ||
          sessionEvent.sessionState === SessionState.SESSION_ENDING
        ) {
          this.notifyListeners('SESSION_ENDED', {}, true);
          // Don't clear messageListeners - keep them so they can be re-attached on next session
        }
      },
    );

    // Emit initial receiver availability
    const initialState = context.getCastState();
    const available = initialState !== CastState.NO_DEVICES_AVAILABLE;
    this.notifyListeners('RECEIVER_LISTENER', { available });
  }

  private setupMessageListenersForSession(session: CastSession | null): void {
    if (!session) {
      return;
    }

    // Re-attach any existing message listeners to the new session
    this.messageListeners.forEach((listener, namespace) => {
      session.addMessageListener(namespace, listener);
    });
  }

  async requestSession(): Promise<SessionObject> {
    if (!this.context) {
      throw new Error('Cast not initialized');
    }

    await this.context.requestSession();
    const session = this.context.getCurrentSession();

    if (!session) {
      throw new Error('No session created');
    }

    return this.createSessionObject(session);
  }

  async launchMedia(_options: {
    mediaUrl: string;
  }): Promise<{ success: boolean }> {
    if (!this.context?.getCurrentSession()) {
      throw new Error('No active session');
    }

    // For custom apps, use sendMessage instead of media loading
    // This is a simplified implementation
    return { success: true };
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
    if (this.context) {
      this.context.endCurrentSession(true);
    }
  }

  async sessionLeave(): Promise<void> {
    if (this.context) {
      this.context.endCurrentSession(false);
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

  async sendMessage(options: {
    namespace: string;
    message: string;
  }): Promise<SendMessageResult> {
    const session = this.context?.getCurrentSession();
    if (!session) {
      return { success: false, error: 'No active session' };
    }

    try {
      const parsedMessage = JSON.parse(options.message);
      await session.sendMessage(options.namespace, parsedMessage);
      return { success: true };
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : 'Failed to send message',
      };
    }
  }

  async addMessageListener(options: { namespace: string }): Promise<void> {
    const session = this.context?.getCurrentSession();

    // Create listener that emits events
    const listener = (namespace: string, message: string) => {
      // Use retainUntilConsumed to queue message if React is re-rendering and temporarily has no listeners
      this.notifyListeners('RECEIVER_MESSAGE', { namespace, message }, true);
    };

    // Store the listener so we can re-attach on session reconnect
    this.messageListeners.set(options.namespace, listener);

    // If there's an active session, attach immediately
    if (session) {
      session.addMessageListener(options.namespace, listener);
    }
  }

  async networkDiagnostic(): Promise<NetworkDiagnosticResult> {
    return {
      networkConnected: navigator.onLine,
      networkType: 'unknown',
      isWiFi: true,
      castConnectionAvailable: !!this.context,
    };
  }

  private createSessionObject(session: CastSession): SessionObject {
    const metadata = session.getApplicationMetadata();
    const device = session.getCastDevice();

    return {
      appId: metadata?.applicationId || this.appId,
      displayName: metadata?.name,
      sessionId: session.getSessionId() || '',
      receiver: {
        friendlyName: device?.friendlyName || '',
        label: device?.label || '',
        volume: {
          level: session.getVolume() || 0,
          muted: session.isMute() || false,
        },
      },
      media: [],
    };
  }
}
