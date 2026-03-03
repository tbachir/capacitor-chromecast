import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import type { PluginListenerHandle } from '@capacitor/core';
import { Chromecast } from '@strasberry/capacitor-chromecast';
import type {
  LoadMediaOptions,
  LoadMediaWithHeadersOptions,
  MediaObject,
  NetworkDiagnosticResult,
  RouteInfo,
  SessionObject,
} from '@strasberry/capacitor-chromecast';

export interface ChromecastState {
  initialized: boolean;
  receiverAvailable: boolean;
  scanning: boolean;
  routes: RouteInfo[];
  session: SessionObject | null;
  media: MediaObject | null;
  lastError: string | null;
}

const INITIAL_STATE: ChromecastState = {
  initialized: false,
  receiverAvailable: false,
  scanning: false,
  routes: [],
  session: null,
  media: null,
  lastError: null,
};

@Injectable({ providedIn: 'root' })
export class ChromecastService {
  private readonly destroyRef = inject(DestroyRef);

  private readonly stateSignal = signal<ChromecastState>(INITIAL_STATE);
  readonly state = this.stateSignal.asReadonly();
  readonly state$ = toObservable(this.state);

  readonly initialized = computed(() => this.state().initialized);
  readonly receiverAvailable = computed(() => this.state().receiverAvailable);
  readonly scanning = computed(() => this.state().scanning);
  readonly routes = computed(() => this.state().routes);
  readonly session = computed(() => this.state().session);
  readonly media = computed(() => this.state().media);
  readonly lastError = computed(() => this.state().lastError);

  private listeners: PluginListenerHandle[] = [];
  private initInFlight: Promise<void> | null = null;
  private bindListenersInFlight: Promise<void> | null = null;
  private listenersBound = false;
  private registeredNamespaces = new Set<string>();

  constructor() {
    this.destroyRef.onDestroy(() => {
      void this.teardown();
    });
  }

  async init(): Promise<void> {
    await this.ensureInitialized();
  }

  async requestSession(): Promise<SessionObject> {
    await this.ensureInitialized();
    return this.runWithErrorHandling(async () => {
      const session = await Chromecast.requestSession();
      this.patchState({ session, lastError: null });
      return session;
    });
  }

  async scanRoutes(timeout = 8): Promise<RouteInfo[]> {
    await this.ensureInitialized();
    this.patchState({ scanning: true });
    return this.runWithErrorHandling(async () => {
      const { routes } = await Chromecast.startRouteScan({ timeout });
      this.patchState({ routes, scanning: false, lastError: null });
      return routes;
    }, () => this.patchState({ scanning: false }));
  }

  async stopRouteScan(): Promise<void> {
    await this.ensureInitialized();
    return this.runWithErrorHandling(async () => {
      await Chromecast.stopRouteScan();
      this.patchState({ scanning: false, lastError: null });
    });
  }

  async selectRoute(routeId: string): Promise<SessionObject> {
    await this.ensureInitialized();
    return this.runWithErrorHandling(async () => {
      const session = await Chromecast.selectRoute({ routeId });
      this.patchState({ session, lastError: null });
      return session;
    });
  }

  async loadMedia(options: LoadMediaOptions): Promise<MediaObject> {
    await this.ensureInitialized();
    return this.runWithErrorHandling(async () => {
      const media = await Chromecast.loadMedia(options);
      this.patchState({ media, lastError: null });
      return media;
    });
  }

  async loadMediaWithHeaders(
    options: LoadMediaWithHeadersOptions,
  ): Promise<MediaObject> {
    await this.ensureInitialized();
    return this.runWithErrorHandling(async () => {
      const media = await Chromecast.loadMediaWithHeaders(options);
      this.patchState({ media, lastError: null });
      return media;
    });
  }

  async pause(): Promise<void> {
    await this.ensureInitialized();
    return this.runWithErrorHandling(() => Chromecast.mediaPause());
  }

  async play(): Promise<void> {
    await this.ensureInitialized();
    return this.runWithErrorHandling(() => Chromecast.mediaPlay());
  }

  async seek(currentTime: number): Promise<void> {
    await this.ensureInitialized();
    return this.runWithErrorHandling(() =>
      Chromecast.mediaSeek({ currentTime }),
    );
  }

  async next(): Promise<void> {
    await this.ensureInitialized();
    return this.runWithErrorHandling(() => Chromecast.mediaNext());
  }

  async prev(): Promise<void> {
    await this.ensureInitialized();
    return this.runWithErrorHandling(() => Chromecast.mediaPrev());
  }

  async leave(): Promise<void> {
    await this.ensureInitialized();
    return this.runWithErrorHandling(async () => {
      await Chromecast.sessionLeave();
      this.patchState({ session: null, media: null, lastError: null });
    });
  }

  async stop(): Promise<void> {
    await this.ensureInitialized();
    return this.runWithErrorHandling(async () => {
      await Chromecast.sessionStop();
      this.patchState({ session: null, media: null, lastError: null });
    });
  }

  async diagnostic(): Promise<NetworkDiagnosticResult> {
    await this.ensureInitialized();
    return this.runWithErrorHandling(() => Chromecast.networkDiagnostic());
  }

  async sendReceiverMessage(namespace: string, payload: unknown): Promise<void> {
    await this.ensureInitialized();
    return this.runWithErrorHandling(async () => {
      if (!this.registeredNamespaces.has(namespace)) {
        await Chromecast.addMessageListener({ namespace });
        this.registeredNamespaces.add(namespace);
      }

      const result = await Chromecast.sendMessage({
        namespace,
        message: JSON.stringify(payload),
      });

      if (!result.success) {
        throw new Error(result.error || 'sendMessage failed');
      }

      this.patchState({ lastError: null });
    });
  }

  async removeReceiverMessageListener(namespace: string): Promise<void> {
    await this.ensureInitialized();
    return this.runWithErrorHandling(async () => {
      await Chromecast.removeMessageListener({ namespace });
      this.registeredNamespaces.delete(namespace);
      this.patchState({ lastError: null });
    });
  }

  clearError(): void {
    this.patchState({ lastError: null });
  }

  private async ensureInitialized(): Promise<void> {
    await this.ensureListenersBound();

    if (this.state().initialized) {
      return;
    }

    if (!this.initInFlight) {
      this.initInFlight = this.initializePlugin().finally(() => {
        this.initInFlight = null;
      });
    }

    await this.initInFlight;
  }

  private async ensureListenersBound(): Promise<void> {
    if (this.listenersBound) {
      return;
    }

    if (!this.bindListenersInFlight) {
      this.bindListenersInFlight = this.bindListeners()
        .then(() => {
          this.listenersBound = true;
        })
        .finally(() => {
          this.bindListenersInFlight = null;
        });
    }

    await this.bindListenersInFlight;
  }

  private async initializePlugin(): Promise<void> {
    return this.runWithErrorHandling(async () => {
      await Chromecast.initialize({
        autoJoinPolicy: 'origin_scoped',
        defaultActionPolicy: 'create_session',
      });

      this.patchState({ initialized: true, lastError: null });
    });
  }

  private async bindListeners(): Promise<void> {
    this.listeners.push(
      await Chromecast.addListener('RECEIVER_LISTENER', payload => {
        this.patchState({
          receiverAvailable: this.extractReceiverAvailable(payload),
        });
      }),
    );

    this.listeners.push(
      await Chromecast.addListener('SESSION_STARTED', payload => {
        const session = this.extractSession(payload);
        if (session) {
          this.patchState({ session, lastError: null });
        }
      }),
    );

    this.listeners.push(
      await Chromecast.addListener('SESSION_RESUMED', payload => {
        const session = this.extractSession(payload);
        if (session) {
          this.patchState({ session, lastError: null });
        }
      }),
    );

    this.listeners.push(
      await Chromecast.addListener('SESSION_LISTENER', payload => {
        const session = this.extractSession(payload);
        if (session) {
          this.patchState({ session, lastError: null });
        }
      }),
    );

    this.listeners.push(
      await Chromecast.addListener('SESSION_UPDATE', payload => {
        const session = this.extractSession(payload);
        if (session) {
          this.patchState({ session, lastError: null });
        }
      }),
    );

    this.listeners.push(
      await Chromecast.addListener('SESSION_ENDED', () => {
        this.patchState({ session: null, media: null });
      }),
    );

    this.listeners.push(
      await Chromecast.addListener('SESSION_START_FAILED', payload => {
        const errorMessage = this.extractErrorMessage(payload);
        this.patchState({ lastError: errorMessage });
      }),
    );

    this.listeners.push(
      await Chromecast.addListener('MEDIA_LOAD', payload => {
        const media = this.extractMedia(payload);
        if (media) {
          this.patchState({ media });
        }
      }),
    );

    this.listeners.push(
      await Chromecast.addListener('MEDIA_UPDATE', payload => {
        const media = this.extractMedia(payload);
        if (media) {
          this.patchState({ media });
        }
      }),
    );
  }

  private async teardown(): Promise<void> {
    await Promise.all(this.listeners.map(handle => handle.remove()));
    this.listeners = [];
    this.listenersBound = false;
    this.registeredNamespaces.clear();
  }

  private extractReceiverAvailable(payload: unknown): boolean {
    if (!this.isRecord(payload)) {
      return false;
    }

    const available = payload['available'];
    const isAvailable = payload['isAvailable'];

    if (typeof available === 'boolean') {
      return available;
    }

    if (typeof isAvailable === 'boolean') {
      return isAvailable;
    }

    return false;
  }

  private extractSession(payload: unknown): SessionObject | null {
    if (!this.isRecord(payload)) {
      return null;
    }

    const wrappedSession = payload['session'];
    if (
      this.isRecord(wrappedSession) &&
      typeof wrappedSession['sessionId'] === 'string'
    ) {
      return wrappedSession as SessionObject;
    }

    if (typeof payload['sessionId'] === 'string') {
      return payload as SessionObject;
    }

    return null;
  }

  private extractMedia(payload: unknown): MediaObject | null {
    if (!this.isRecord(payload)) {
      return null;
    }

    if (typeof payload['mediaSessionId'] === 'number') {
      return payload as MediaObject;
    }

    const wrappedMedia = payload['media'];
    if (
      this.isRecord(wrappedMedia) &&
      typeof wrappedMedia['mediaSessionId'] === 'number'
    ) {
      return wrappedMedia as MediaObject;
    }

    return null;
  }

  private extractErrorMessage(payload: unknown): string {
    if (this.isRecord(payload) && typeof payload['error'] === 'string') {
      return payload['error'];
    }

    return 'session_start_failed';
  }

  private patchState(partial: Partial<ChromecastState>): void {
    this.stateSignal.update(current => ({ ...current, ...partial }));
  }

  private async runWithErrorHandling<T>(
    operation: () => Promise<T>,
    onError?: () => void,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      onError?.();
      this.patchState({
        lastError: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}
