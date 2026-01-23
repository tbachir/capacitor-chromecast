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
    initialize(options?: InitializeOptions): Promise<void>;
    private setupCastContext;
    private setupMessageListenersForSession;
    requestSession(): Promise<SessionObject>;
    launchMedia(_options: {
        mediaUrl: string;
    }): Promise<{
        success: boolean;
    }>;
    loadMedia(_options: LoadMediaOptions): Promise<MediaObject>;
    loadMediaWithHeaders(_options: LoadMediaWithHeadersOptions): Promise<MediaObject>;
    mediaPause(): Promise<void>;
    mediaPlay(): Promise<void>;
    mediaSeek(_options: {
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
    networkDiagnostic(): Promise<NetworkDiagnosticResult>;
    private createSessionObject;
}
