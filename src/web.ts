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
        RemotePlayerEventType: {
          ANY_CHANGE: string;
          IS_PAUSED_CHANGED: string;
          CURRENT_TIME_CHANGED: string;
          PLAYER_STATE_CHANGED: string;
        };
        RemotePlayer: new () => RemotePlayer;
        RemotePlayerController: new (
          player: RemotePlayer,
        ) => RemotePlayerController;
      };
    };
    chrome: {
      cast: {
        AutoJoinPolicy: {
          TAB_AND_ORIGIN_SCOPED: string;
          ORIGIN_SCOPED: string;
          PAGE_SCOPED: string;
        };
        media: {
          MediaInfo: new (
            contentId: string,
            contentType: string,
          ) => ChromeMediaInfo;
          LoadRequest: new (mediaInfo: ChromeMediaInfo) => ChromeLoadRequest;
          GenericMediaMetadata: new () => ChromeGenericMediaMetadata;
          TextTrackStyle: new () => ChromeTextTrackStyle;
          StreamType: {
            BUFFERED: string;
            LIVE: string;
            OTHER: string;
          };
          PlayerState: {
            IDLE: string;
            PLAYING: string;
            PAUSED: string;
            BUFFERING: string;
          };
          IdleReason: {
            CANCELLED: string;
            INTERRUPTED: string;
            FINISHED: string;
            ERROR: string;
          };
          QueueJumpItemId: number;
        };
        Image: new (url: string) => ChromeImage;
      };
    };
  }

  interface ChromeMediaInfo {
    contentId: string;
    contentType: string;
    streamType: string;
    duration: number | null;
    metadata: ChromeGenericMediaMetadata | null;
    customData: Record<string, unknown> | null;
    textTrackStyle: ChromeTextTrackStyle | null;
  }

  interface ChromeLoadRequest {
    mediaInfo: ChromeMediaInfo;
    autoplay: boolean;
    currentTime: number;
    customData: Record<string, unknown> | null;
  }

  interface ChromeGenericMediaMetadata {
    metadataType: number;
    title: string;
    subtitle: string;
    images: ChromeImage[];
  }

  interface ChromeTextTrackStyle {
    fontScale: number;
    fontFamily: string;
  }

  interface ChromeImage {
    url: string;
  }

  interface ChromeCastError {
    code: string;
    description: string | null;
    details: object | null;
  }

  type ChromeCastErrorCode = string;

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
    loadMedia(
      loadRequest: ChromeLoadRequest,
    ): Promise<ChromeCastErrorCode | null>;
    getMediaSession(): ChromeMediaSession | null;
  }

  interface ChromeMediaSession {
    mediaSessionId: number;
    media: ChromeMediaInfo | null;
    playbackRate: number;
    playerState: string;
    idleReason: string | null;
    currentTime: number;
    customData: Record<string, unknown>;
    currentItemId: number;
    volume: { level: number; muted: boolean };
    getEstimatedTime(): number;
    queueNext(
      successCallback?: () => void,
      errorCallback?: (error: ChromeCastError) => void,
    ): void;
    queuePrev(
      successCallback?: () => void,
      errorCallback?: (error: ChromeCastError) => void,
    ): void;
  }

  interface RemotePlayer {
    isConnected: boolean;
    isPaused: boolean;
    currentTime: number;
    duration: number;
    volumeLevel: number;
    isMuted: boolean;
    playerState: string;
    mediaInfo: ChromeMediaInfo | null;
  }

  interface RemotePlayerController {
    playOrPause(): void;
    seek(): void;
    stop(): void;
    setVolumeLevel(): void;
    muteOrUnmute(): void;
    addEventListener(type: string, handler: (event: unknown) => void): void;
    removeEventListener(type: string, handler: (event: unknown) => void): void;
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
  private remotePlayer: RemotePlayer | null = null;
  private remotePlayerController: RemotePlayerController | null = null;

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

  private applyCastOptions(
    context: CastContext,
    options?: InitializeOptions,
  ): void {
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
  }

  private setupCastContext(options?: InitializeOptions): void {
    const context = window.cast.framework.CastContext.getInstance();
    this.context = context;
    this.applyCastOptions(context, options);

    // Re-initialization should update Cast options (appId / join policy) without
    // duplicating event listeners.
    if (this.contextSetup) {
      const { CastState } = window.cast.framework;
      const available = context.getCastState() !== CastState.NO_DEVICES_AVAILABLE;
      this.notifyListeners('RECEIVER_LISTENER', {
        available,
        isAvailable: available,
      });
      return;
    }
    this.contextSetup = true;

    // Listen for cast state changes (receiver availability)
    const { CastState } = window.cast.framework;
    context.addEventListener(
      window.cast.framework.CastContextEventType.CAST_STATE_CHANGED,
      (event: CastStateEvent | SessionStateEvent) => {
        const castEvent = event as CastStateEvent;
        const available =
          castEvent.castState !== CastState.NO_DEVICES_AVAILABLE;
        this.notifyListeners('RECEIVER_LISTENER', {
          available,
          isAvailable: available,
        });
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
    this.notifyListeners('RECEIVER_LISTENER', {
      available,
      isAvailable: available,
    });

    // Initialize RemotePlayer and RemotePlayerController for media control
    this.remotePlayer = new window.cast.framework.RemotePlayer();
    this.remotePlayerController = new window.cast.framework.RemotePlayerController(
      this.remotePlayer,
    );
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

  async launchMedia(options: {
    mediaUrl: string;
  }): Promise<{ success: boolean }> {
    const session = this.context?.getCurrentSession();
    if (!session) {
      throw new Error('No active session');
    }

    const contentType = this.detectContentType(options.mediaUrl);

    const mediaInfo = new window.chrome.cast.media.MediaInfo(
      options.mediaUrl,
      contentType,
    );
    mediaInfo.streamType = window.chrome.cast.media.StreamType.BUFFERED;

    const loadRequest = new window.chrome.cast.media.LoadRequest(mediaInfo);
    loadRequest.autoplay = true;
    loadRequest.currentTime = 0;

    const error = await session.loadMedia(loadRequest);
    if (error) {
      throw new Error(`Failed to load media: ${error}`);
    }

    return { success: true };
  }

  private detectContentType(url: string): string {
    const urlWithoutQuery = url.toLowerCase().split('?')[0];

    if (urlWithoutQuery.endsWith('.m3u8')) {
      return 'application/x-mpegURL';
    } else if (urlWithoutQuery.endsWith('.mpd')) {
      return 'application/dash+xml';
    } else if (urlWithoutQuery.endsWith('.mp4')) {
      return 'video/mp4';
    } else if (urlWithoutQuery.endsWith('.webm')) {
      return 'video/webm';
    } else if (urlWithoutQuery.endsWith('.mkv')) {
      return 'video/x-matroska';
    }

    return 'video/mp4';
  }

  async loadMedia(options: LoadMediaOptions): Promise<MediaObject> {
    const session = this.context?.getCurrentSession();
    if (!session) {
      throw new Error('No active session');
    }

    const mediaInfo = new window.chrome.cast.media.MediaInfo(
      options.contentId,
      options.contentType || 'video/mp4',
    );

    // Set stream type
    const streamTypeMap: Record<string, string> = {
      buffered: window.chrome.cast.media.StreamType.BUFFERED,
      live: window.chrome.cast.media.StreamType.LIVE,
      other: window.chrome.cast.media.StreamType.OTHER,
      BUFFERED: window.chrome.cast.media.StreamType.BUFFERED,
      LIVE: window.chrome.cast.media.StreamType.LIVE,
      OTHER: window.chrome.cast.media.StreamType.OTHER,
    };
    mediaInfo.streamType =
      streamTypeMap[options.streamType || 'buffered'] ||
      window.chrome.cast.media.StreamType.BUFFERED;

    if (options.duration !== undefined) {
      mediaInfo.duration = options.duration;
    }

    if (options.customData) {
      mediaInfo.customData = options.customData;
    }

    // Set metadata if provided
    if (options.metadata) {
      const metadata = new window.chrome.cast.media.GenericMediaMetadata();
      metadata.metadataType = options.metadata.metadataType ?? 0;
      metadata.title = options.metadata.title ?? '';
      metadata.subtitle = options.metadata.subtitle ?? '';
      if (options.metadata.images) {
        metadata.images = options.metadata.images.map(
          img => new window.chrome.cast.Image(img.url),
        );
      }
      mediaInfo.metadata = metadata;
    }

    // Set text track style if provided
    if (options.textTrackStyle) {
      const trackStyle = new window.chrome.cast.media.TextTrackStyle();
      if (options.textTrackStyle.fontScale !== undefined) {
        trackStyle.fontScale = options.textTrackStyle.fontScale;
      }
      if (options.textTrackStyle.fontFamily) {
        trackStyle.fontFamily = options.textTrackStyle.fontFamily;
      }
      mediaInfo.textTrackStyle = trackStyle;
    }

    const loadRequest = new window.chrome.cast.media.LoadRequest(mediaInfo);
    loadRequest.autoplay = options.autoPlay ?? true;
    loadRequest.currentTime = options.currentTime ?? 0;

    const error = await session.loadMedia(loadRequest);
    if (error) {
      throw new Error(`Failed to load media: ${error}`);
    }

    const mediaSession = session.getMediaSession();
    return this.createMediaObject(mediaSession, session.getSessionId());
  }

  async loadMediaWithHeaders(
    options: LoadMediaWithHeadersOptions,
  ): Promise<MediaObject> {
    // For web, headers can be passed via customData to be handled by the receiver
    const customData = {
      ...options.customData,
      ...(options.authHeaders && { headers: options.authHeaders }),
      ...(options.authToken && { authToken: options.authToken }),
    };

    return this.loadMedia({
      ...options,
      customData,
    });
  }

  async mediaPause(): Promise<void> {
    if (!this.remotePlayer || !this.remotePlayerController) {
      throw new Error('Cast not initialized');
    }
    if (!this.remotePlayer.isPaused) {
      this.remotePlayerController.playOrPause();
    }
  }

  async mediaPlay(): Promise<void> {
    if (!this.remotePlayer || !this.remotePlayerController) {
      throw new Error('Cast not initialized');
    }
    if (this.remotePlayer.isPaused) {
      this.remotePlayerController.playOrPause();
    }
  }

  async mediaSeek(options: { currentTime: number }): Promise<void> {
    if (!this.remotePlayer || !this.remotePlayerController) {
      throw new Error('Cast not initialized');
    }
    this.remotePlayer.currentTime = options.currentTime;
    this.remotePlayerController.seek();
  }

  async mediaNext(): Promise<void> {
    const session = this.context?.getCurrentSession();
    const mediaSession = session?.getMediaSession();
    if (!mediaSession) {
      throw new Error('No active media session');
    }
    return new Promise((resolve, reject) => {
      mediaSession.queueNext(
        () => resolve(),
        error =>
          reject(new Error(error.description || 'Failed to skip to next')),
      );
    });
  }

  async mediaPrev(): Promise<void> {
    const session = this.context?.getCurrentSession();
    const mediaSession = session?.getMediaSession();
    if (!mediaSession) {
      throw new Error('No active media session');
    }
    return new Promise((resolve, reject) => {
      mediaSession.queuePrev(
        () => resolve(),
        error =>
          reject(new Error(error.description || 'Failed to go to previous')),
      );
    });
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
    // Web Cast SDK does not support programmatic device scanning.
    // Device discovery is handled automatically by the browser's Cast button.
    // Return empty routes - use requestSession() to show the device picker.
    return { routes: [] };
  }

  async stopRouteScan(): Promise<void> {
    // Web Cast SDK does not support programmatic device scanning.
    // This is a no-op on web.
  }

  async selectRoute(_options: { routeId: string }): Promise<SessionObject> {
    // Web Cast SDK does not support programmatic device selection.
    // Use requestSession() to show the device picker dialog instead.
    throw new Error(
      'Programmatic device selection is not supported on web. Use requestSession() to show the device picker.',
    );
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

  async removeMessageListener(options: { namespace: string }): Promise<void> {
    const session = this.context?.getCurrentSession();
    const listener = this.messageListeners.get(options.namespace);

    if (session && listener) {
      session.removeMessageListener(options.namespace, listener);
    }

    this.messageListeners.delete(options.namespace);
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

  private createMediaObject(
    mediaSession: ChromeMediaSession | null,
    sessionId: string,
  ): MediaObject {
    if (!mediaSession) {
      return {
        currentItemId: 0,
        currentTime: 0,
        customData: {},
        mediaSessionId: 0,
        playbackRate: 1,
        playerState: 'UNKNOWN',
        isAlive: false,
        volume: { level: 1, muted: false },
        sessionId,
      };
    }

    const { PlayerState, IdleReason } = window.chrome.cast.media;
    const playerStateMap: Record<string, MediaObject['playerState']> = {
      [PlayerState.IDLE]: 'IDLE',
      [PlayerState.PLAYING]: 'PLAYING',
      [PlayerState.PAUSED]: 'PAUSED',
      [PlayerState.BUFFERING]: 'BUFFERING',
    };

    const idleReasonMap: Record<string, MediaObject['idleReason']> = {
      [IdleReason.CANCELLED]: 'CANCELLED',
      [IdleReason.ERROR]: 'ERROR',
      [IdleReason.FINISHED]: 'FINISHED',
      [IdleReason.INTERRUPTED]: 'INTERRUPTED',
    };

    const mediaInfo = mediaSession.media;
    const result: MediaObject = {
      currentItemId: mediaSession.currentItemId || 0,
      currentTime:
        mediaSession.getEstimatedTime?.() ?? mediaSession.currentTime ?? 0,
      customData: mediaSession.customData || {},
      mediaSessionId: mediaSession.mediaSessionId || 0,
      playbackRate: mediaSession.playbackRate || 1,
      playerState: playerStateMap[mediaSession.playerState] || 'UNKNOWN',
      isAlive: mediaSession.playerState !== PlayerState.IDLE,
      volume: {
        level:
          mediaSession.volume?.level ?? this.remotePlayer?.volumeLevel ?? 1,
        muted:
          mediaSession.volume?.muted ?? this.remotePlayer?.isMuted ?? false,
      },
      sessionId,
    };

    if (mediaSession.idleReason) {
      result.idleReason = idleReasonMap[mediaSession.idleReason];
    }

    if (mediaInfo) {
      const streamTypeMap: Record<string, 'BUFFERED' | 'LIVE' | 'OTHER'> = {
        [window.chrome.cast.media.StreamType.BUFFERED]: 'BUFFERED',
        [window.chrome.cast.media.StreamType.LIVE]: 'LIVE',
        [window.chrome.cast.media.StreamType.OTHER]: 'OTHER',
      };

      result.media = {
        contentId: mediaInfo.contentId,
        contentType: mediaInfo.contentType,
        customData: mediaInfo.customData || {},
        duration: mediaInfo.duration ?? 0,
        streamType: streamTypeMap[mediaInfo.streamType] || 'BUFFERED',
      };

      if (mediaInfo.metadata) {
        result.media.metadata = {
          metadataType: mediaInfo.metadata.metadataType,
          title: mediaInfo.metadata.title,
          subtitle: mediaInfo.metadata.subtitle,
          images: mediaInfo.metadata.images?.map(img => ({ url: img.url })),
        };
      }
    }

    return result;
  }
}
