import { ListenerCallback, PluginListenerHandle } from '@capacitor/core';
export interface InitializeOptions {
    appId?: string;
    autoJoinPolicy?: 'tab_and_origin_scoped' | 'origin_scoped' | 'page_scoped';
    defaultActionPolicy?: 'create_session' | 'cast_this_tab';
}
export interface LoadMediaOptions {
    contentId: string;
    customData?: Record<string, unknown>;
    contentType?: string;
    duration?: number;
    streamType?: 'buffered' | 'live' | 'other' | 'BUFFERED' | 'LIVE' | 'OTHER';
    autoPlay?: boolean;
    currentTime?: number;
    metadata?: MediaMetadata;
    textTrackStyle?: TextTrackStyle;
}
export interface LoadMediaWithHeadersOptions extends LoadMediaOptions {
    authHeaders?: Record<string, string>;
    authToken?: string;
}
export interface MediaMetadata {
    metadataType?: number;
    title?: string;
    subtitle?: string;
    images?: Array<{
        url: string;
    }>;
}
export interface TextTrackStyle {
    fontScale?: number;
    fontFamily?: string;
}
export interface SessionObject {
    appId: string;
    displayName?: string;
    sessionId: string;
    appImages?: Array<{
        url: string;
    }>;
    receiver: {
        friendlyName: string;
        label: string;
        volume: {
            level: number;
            muted: boolean;
        };
    };
    media: MediaObject[];
    status?: string;
}
export interface MediaObject {
    currentItemId: number;
    currentTime: number;
    customData: Record<string, unknown>;
    mediaSessionId: number;
    playbackRate: number;
    playerState: 'IDLE' | 'PLAYING' | 'PAUSED' | 'BUFFERING' | 'UNKNOWN';
    idleReason?: 'CANCELLED' | 'ERROR' | 'FINISHED' | 'INTERRUPTED';
    isAlive: boolean;
    volume: {
        level: number;
        muted: boolean;
    };
    media?: {
        contentId: string;
        contentType: string;
        customData: Record<string, unknown>;
        duration: number;
        streamType: 'BUFFERED' | 'LIVE' | 'OTHER';
        metadata?: MediaMetadata;
    };
    sessionId: string;
}
export interface RouteInfo {
    id: string;
    name: string;
    description: string;
    isNearbyDevice: boolean;
}
export interface NetworkDiagnosticResult {
    networkConnected: boolean;
    networkType?: string;
    networkState?: string;
    isWiFi?: boolean;
    warning?: string;
    error?: string;
    googlePlayServices?: boolean;
    gmsError?: string;
    castConnectionAvailable?: boolean;
}
export interface SendMessageResult {
    success: boolean;
    error?: string;
}
export interface ChromecastPlugin {
    /**
     * Initialize the Chromecast SDK with optional app ID.
     * If no app ID is provided, the default media receiver is used.
     */
    initialize(options?: InitializeOptions): Promise<void>;
    /**
     * Request a Chromecast session. This will show the device picker dialog.
     */
    requestSession(): Promise<SessionObject>;
    /**
     * Simple method to launch media on the current session.
     * For more control, use loadMedia instead.
     */
    launchMedia(options: {
        mediaUrl: string;
    }): Promise<{
        success: boolean;
    }>;
    /**
     * Load media with full control over playback options.
     */
    loadMedia(options: LoadMediaOptions): Promise<MediaObject>;
    /**
     * Load media with authentication headers for protected content.
     */
    loadMediaWithHeaders(options: LoadMediaWithHeadersOptions): Promise<MediaObject>;
    /**
     * Pause the current media.
     */
    mediaPause(): Promise<void>;
    /**
     * Play/resume the current media.
     */
    mediaPlay(): Promise<void>;
    /**
     * Seek to a position in the current media.
     * @param options.currentTime - Position in seconds
     */
    mediaSeek(options: {
        currentTime: number;
    }): Promise<void>;
    /**
     * Skip to next item in queue.
     */
    mediaNext(): Promise<void>;
    /**
     * Go to previous item in queue.
     */
    mediaPrev(): Promise<void>;
    /**
     * Stop the current session and stop casting on the receiver.
     */
    sessionStop(): Promise<void>;
    /**
     * Leave the current session but keep the receiver playing.
     */
    sessionLeave(): Promise<void>;
    /**
     * Start scanning for available Chromecast devices.
     */
    startRouteScan(options?: {
        timeout?: number;
    }): Promise<{
        routes: RouteInfo[];
    }>;
    /**
     * Stop scanning for devices.
     */
    stopRouteScan(): Promise<void>;
    /**
     * Connect to a specific device by route ID.
     */
    selectRoute(options: {
        routeId: string;
    }): Promise<SessionObject>;
    /**
     * Send a custom message to the receiver.
     */
    sendMessage(options: {
        namespace: string;
        message: string;
    }): Promise<SendMessageResult>;
    /**
     * Add a listener for messages from the receiver on a specific namespace.
     */
    addMessageListener(options: {
        namespace: string;
    }): Promise<void>;
    /**
     * Remove a message listener for a specific namespace.
     */
    removeMessageListener(options: {
        namespace: string;
    }): Promise<void>;
    /**
     * Get network diagnostic information.
     */
    networkDiagnostic(): Promise<NetworkDiagnosticResult>;
    /**
     * Add a listener for Chromecast events.
     *
     * Available events:
     * - SESSION_LISTENER: Fired when a session is rejoined
     * - SESSION_UPDATE: Fired when session state changes
     * - SESSION_STARTED: Fired when a new session starts
     * - SESSION_ENDED: Fired when session ends
     * - SESSION_RESUMED: Fired when session is resumed
     * - SESSION_START_FAILED: Fired when session fails to start
     * - RECEIVER_LISTENER: Fired when receiver availability changes
     * - MEDIA_LOAD: Fired when media is loaded
     * - MEDIA_UPDATE: Fired when media state changes
     * - RECEIVER_MESSAGE: Fired when a custom message is received
     * - SETUP: Fired when plugin is set up
     */
    addListener(eventName: string, listenerFunc: ListenerCallback): Promise<PluginListenerHandle> & PluginListenerHandle;
}
