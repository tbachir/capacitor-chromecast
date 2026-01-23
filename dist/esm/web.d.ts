import { WebPlugin } from '@capacitor/core';
import type { ChromecastPlugin, InitializeOptions, LoadMediaOptions, LoadMediaWithHeadersOptions, MediaObject, NetworkDiagnosticResult, RouteInfo, SendMessageResult, SessionObject } from './definitions';
declare global {
    interface Window {
        __onGCastApiAvailable: (isAvailable: boolean) => void;
        chrome: any;
    }
}
export declare class ChromecastWeb extends WebPlugin implements Omit<ChromecastPlugin, 'addListener'> {
    private cast;
    private session;
    initialize(options?: InitializeOptions): Promise<void>;
    requestSession(): Promise<SessionObject>;
    launchMedia(options: {
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
    sendMessage(_options: {
        namespace: string;
        message: string;
    }): Promise<SendMessageResult>;
    addMessageListener(_options: {
        namespace: string;
    }): Promise<void>;
    networkDiagnostic(): Promise<NetworkDiagnosticResult>;
    private createSessionObject;
}
