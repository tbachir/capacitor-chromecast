import { WebPlugin } from '@capacitor/core';
import type { ChromecastPlugin, InitializeOptions, LoadMediaOptions, LoadMediaWithHeadersOptions, MediaObject, NetworkDiagnosticResult, RouteInfo, SendMessageResult, SessionObject } from './definitions';
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
                RemotePlayerController: new (player: RemotePlayer) => RemotePlayerController;
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
                    MediaInfo: new (contentId: string, contentType: string) => ChromeMediaInfo;
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
        addEventListener(type: string, handler: (event: CastStateEvent | SessionStateEvent) => void): void;
    }
    interface CastSession {
        getSessionId(): string;
        getApplicationMetadata(): {
            applicationId: string;
            name: string;
        } | null;
        getCastDevice(): {
            friendlyName: string;
            label: string;
        } | null;
        getVolume(): number;
        isMute(): boolean;
        sendMessage(namespace: string, message: unknown): Promise<void>;
        addMessageListener(namespace: string, listener: (namespace: string, message: string) => void): void;
        removeMessageListener(namespace: string, listener: (namespace: string, message: string) => void): void;
        loadMedia(loadRequest: ChromeLoadRequest): Promise<ChromeCastErrorCode | null>;
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
        volume: {
            level: number;
            muted: boolean;
        };
        getEstimatedTime(): number;
        queueNext(successCallback?: () => void, errorCallback?: (error: ChromeCastError) => void): void;
        queuePrev(successCallback?: () => void, errorCallback?: (error: ChromeCastError) => void): void;
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
export declare class ChromecastWeb extends WebPlugin implements Omit<ChromecastPlugin, 'addListener'> {
    private context;
    private messageListeners;
    private appId;
    private contextSetup;
    private remotePlayer;
    private remotePlayerController;
    initialize(options?: InitializeOptions): Promise<void>;
    private setupCastContext;
    private setupMessageListenersForSession;
    requestSession(): Promise<SessionObject>;
    launchMedia(options: {
        mediaUrl: string;
    }): Promise<{
        success: boolean;
    }>;
    private detectContentType;
    loadMedia(options: LoadMediaOptions): Promise<MediaObject>;
    loadMediaWithHeaders(options: LoadMediaWithHeadersOptions): Promise<MediaObject>;
    mediaPause(): Promise<void>;
    mediaPlay(): Promise<void>;
    mediaSeek(options: {
        currentTime: number;
    }): Promise<void>;
    mediaNext(): Promise<void>;
    mediaPrev(): Promise<void>;
    sessionStop(): Promise<void>;
    sessionLeave(): Promise<void>;
    startRouteScan(_options?: {
        timeout?: number;
    }): Promise<{
        routes: RouteInfo[];
    }>;
    stopRouteScan(): Promise<void>;
    selectRoute(_options: {
        routeId: string;
    }): Promise<SessionObject>;
    sendMessage(options: {
        namespace: string;
        message: string;
    }): Promise<SendMessageResult>;
    addMessageListener(options: {
        namespace: string;
    }): Promise<void>;
    removeMessageListener(options: {
        namespace: string;
    }): Promise<void>;
    networkDiagnostic(): Promise<NetworkDiagnosticResult>;
    private createSessionObject;
    private createMediaObject;
}
