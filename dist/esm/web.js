import { Capacitor, WebPlugin } from '@capacitor/core';
export class ChromecastWeb extends WebPlugin {
    constructor() {
        super(...arguments);
        this.context = null;
        this.messageListeners = new Map();
        this.appId = '';
        this.contextSetup = false;
        this.remotePlayer = null;
        this.remotePlayerController = null;
        this.castSdkLoadPromise = null;
    }
    async initialize(options) {
        var _a, _b;
        this.assertSupportedWebSenderEnvironment();
        // Check if already loaded
        if (((_a = window.cast) === null || _a === void 0 ? void 0 : _a.framework) && ((_b = window.chrome) === null || _b === void 0 ? void 0 : _b.cast)) {
            this.setupCastContext(options);
            return;
        }
        if (!this.castSdkLoadPromise) {
            this.castSdkLoadPromise = this.loadCastSenderSdk();
        }
        try {
            await this.castSdkLoadPromise;
        }
        catch (error) {
            this.castSdkLoadPromise = null;
            throw error;
        }
        this.setupCastContext(options);
    }
    async loadCastSenderSdk() {
        var _a, _b;
        if (((_a = window.cast) === null || _a === void 0 ? void 0 : _a.framework) && ((_b = window.chrome) === null || _b === void 0 ? void 0 : _b.cast)) {
            return;
        }
        return new Promise((resolve, reject) => {
            var _a, _b;
            let settled = false;
            const previousCallback = window.__onGCastApiAvailable;
            const settle = (error) => {
                if (settled) {
                    return;
                }
                settled = true;
                window.clearTimeout(timeoutId);
                if (window.__onGCastApiAvailable === onCastApiAvailable) {
                    if (typeof previousCallback === 'function') {
                        window.__onGCastApiAvailable = previousCallback;
                    }
                    else {
                        delete window.__onGCastApiAvailable;
                    }
                }
                script.removeEventListener('error', onScriptError);
                if (error) {
                    reject(error);
                }
                else {
                    resolve();
                }
            };
            const waitForFrameworkReady = () => {
                const startedAt = Date.now();
                const check = () => {
                    var _a, _b;
                    if (((_a = window.cast) === null || _a === void 0 ? void 0 : _a.framework) && ((_b = window.chrome) === null || _b === void 0 ? void 0 : _b.cast)) {
                        settle();
                        return;
                    }
                    if (Date.now() - startedAt >
                        ChromecastWeb.CAST_FRAMEWORK_READY_TIMEOUT_MS) {
                        settle(new Error('Cast framework not available'));
                        return;
                    }
                    window.setTimeout(check, 100);
                };
                check();
            };
            const onCastApiAvailable = (isAvailable) => {
                if (typeof previousCallback === 'function') {
                    previousCallback(isAvailable);
                }
                if (!isAvailable) {
                    settle(new Error('Cast API not available'));
                    return;
                }
                waitForFrameworkReady();
            };
            const onScriptError = () => {
                settle(new Error('Failed to load Cast SDK script'));
            };
            // Google Cast Web Sender requires this callback to be set before script load.
            window.__onGCastApiAvailable = onCastApiAvailable;
            const existingScript = document.querySelector(`script[src="${ChromecastWeb.CAST_SENDER_SCRIPT_SRC}"]`);
            const script = existingScript !== null && existingScript !== void 0 ? existingScript : this.createCastSenderScript();
            script.addEventListener('error', onScriptError, { once: true });
            const timeoutId = window.setTimeout(() => {
                settle(new Error('Cast SDK load timeout'));
            }, ChromecastWeb.CAST_SDK_LOAD_TIMEOUT_MS);
            if (!existingScript) {
                const target = (_b = (_a = document.body) !== null && _a !== void 0 ? _a : document.head) !== null && _b !== void 0 ? _b : document.documentElement;
                if (!target) {
                    settle(new Error('Unable to inject Cast SDK script in document'));
                    return;
                }
                target.appendChild(script);
            }
        });
    }
    createCastSenderScript() {
        const script = document.createElement('script');
        script.setAttribute('type', 'text/javascript');
        script.setAttribute('src', ChromecastWeb.CAST_SENDER_SCRIPT_SRC);
        return script;
    }
    assertSupportedWebSenderEnvironment() {
        const platform = Capacitor.getPlatform();
        if (platform !== 'web') {
            throw new Error(`Chromecast web fallback loaded on '${platform}'. Native plugin may be missing. Run "npx cap sync" and rebuild the app.`);
        }
        if (!this.isSecureContextForCast()) {
            throw new Error('Google Cast Web Sender requires a secure context (HTTPS) or localhost.');
        }
        if (this.isUnsupportedIosWebSenderEnvironment()) {
            throw new Error('Google Cast Web Sender is not supported on iOS browsers or WKWebView. Use the native Capacitor iOS plugin instead.');
        }
    }
    isSecureContextForCast() {
        if (window.isSecureContext) {
            return true;
        }
        if (window.location.protocol !== 'http:') {
            return false;
        }
        const host = window.location.hostname;
        return host === 'localhost' || host === '127.0.0.1' || host === '::1';
    }
    isUnsupportedIosWebSenderEnvironment() {
        const userAgent = navigator.userAgent || '';
        const platform = navigator.platform || '';
        const maxTouchPoints = navigator.maxTouchPoints || 0;
        return (/iPad|iPhone|iPod/i.test(userAgent) ||
            (/Mac/i.test(platform) && maxTouchPoints > 1));
    }
    applyCastOptions(context, options) {
        this.appId = this.resolveAppId(options);
        const autoJoinPolicyMap = {
            tab_and_origin_scoped: window.chrome.cast.AutoJoinPolicy.TAB_AND_ORIGIN_SCOPED,
            origin_scoped: window.chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
            page_scoped: window.chrome.cast.AutoJoinPolicy.PAGE_SCOPED,
        };
        context.setOptions({
            receiverApplicationId: this.appId,
            autoJoinPolicy: autoJoinPolicyMap[(options === null || options === void 0 ? void 0 : options.autoJoinPolicy) || 'origin_scoped'] ||
                window.chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
        });
    }
    resolveAppId(options) {
        var _a, _b, _c, _d, _e, _f;
        const callAppId = (_a = options === null || options === void 0 ? void 0 : options.appId) === null || _a === void 0 ? void 0 : _a.trim();
        if (callAppId) {
            return callAppId;
        }
        const configuredAppId = (_f = (_e = (_d = (_c = (_b = globalThis.Capacitor) === null || _b === void 0 ? void 0 : _b.config) === null || _c === void 0 ? void 0 : _c.plugins) === null || _d === void 0 ? void 0 : _d.Chromecast) === null || _e === void 0 ? void 0 : _e.appId) === null || _f === void 0 ? void 0 : _f.trim();
        if (configuredAppId) {
            return configuredAppId;
        }
        return ChromecastWeb.DEFAULT_RECEIVER_APP_ID;
    }
    setupCastContext(options) {
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
        context.addEventListener(window.cast.framework.CastContextEventType.CAST_STATE_CHANGED, (event) => {
            const castEvent = event;
            const available = castEvent.castState !== CastState.NO_DEVICES_AVAILABLE;
            this.notifyListeners('RECEIVER_LISTENER', {
                available,
                isAvailable: available,
            });
        });
        // Listen for session state changes
        const { SessionState } = window.cast.framework;
        context.addEventListener(window.cast.framework.CastContextEventType.SESSION_STATE_CHANGED, (event) => {
            const sessionEvent = event;
            const session = context.getCurrentSession();
            if (sessionEvent.sessionState === SessionState.SESSION_STARTED) {
                // Attach message listeners BEFORE notifying about session start
                this.setupMessageListenersForSession(session);
                const sessionData = {
                    session: session ? this.createSessionObject(session) : null,
                };
                // Use retainUntilConsumed to queue event if React is re-rendering and temporarily has no listeners
                this.notifyListeners('SESSION_STARTED', sessionData, true);
            }
            else if (sessionEvent.sessionState === SessionState.SESSION_RESUMED) {
                // Attach message listeners BEFORE notifying about session resume
                this.setupMessageListenersForSession(session);
                const sessionData = {
                    session: session ? this.createSessionObject(session) : null,
                };
                this.notifyListeners('SESSION_RESUMED', sessionData, true);
            }
            else if (sessionEvent.sessionState === SessionState.SESSION_ENDED ||
                sessionEvent.sessionState === SessionState.SESSION_ENDING) {
                this.notifyListeners('SESSION_ENDED', {}, true);
                // Don't clear messageListeners - keep them so they can be re-attached on next session
            }
        });
        // Emit initial receiver availability
        const initialState = context.getCastState();
        const available = initialState !== CastState.NO_DEVICES_AVAILABLE;
        this.notifyListeners('RECEIVER_LISTENER', {
            available,
            isAvailable: available,
        });
        // Initialize RemotePlayer and RemotePlayerController for media control
        this.remotePlayer = new window.cast.framework.RemotePlayer();
        this.remotePlayerController = new window.cast.framework.RemotePlayerController(this.remotePlayer);
    }
    setupMessageListenersForSession(session) {
        if (!session) {
            return;
        }
        // Re-attach any existing message listeners to the new session
        this.messageListeners.forEach((listener, namespace) => {
            session.addMessageListener(namespace, listener);
        });
    }
    async requestSession() {
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
    async launchMedia(options) {
        var _a;
        const session = (_a = this.context) === null || _a === void 0 ? void 0 : _a.getCurrentSession();
        if (!session) {
            throw new Error('No active session');
        }
        const contentType = this.detectContentType(options.mediaUrl);
        const mediaInfo = new window.chrome.cast.media.MediaInfo(options.mediaUrl, contentType);
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
    detectContentType(url) {
        const urlWithoutQuery = url.toLowerCase().split('?')[0];
        if (urlWithoutQuery.endsWith('.m3u8')) {
            return 'application/x-mpegURL';
        }
        else if (urlWithoutQuery.endsWith('.mpd')) {
            return 'application/dash+xml';
        }
        else if (urlWithoutQuery.endsWith('.mp4')) {
            return 'video/mp4';
        }
        else if (urlWithoutQuery.endsWith('.webm')) {
            return 'video/webm';
        }
        else if (urlWithoutQuery.endsWith('.mkv')) {
            return 'video/x-matroska';
        }
        return 'video/mp4';
    }
    async loadMedia(options) {
        var _a, _b, _c, _d, _e, _f;
        const session = (_a = this.context) === null || _a === void 0 ? void 0 : _a.getCurrentSession();
        if (!session) {
            throw new Error('No active session');
        }
        const mediaInfo = new window.chrome.cast.media.MediaInfo(options.contentId, options.contentType || 'video/mp4');
        // Set stream type
        const streamTypeMap = {
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
            metadata.metadataType = (_b = options.metadata.metadataType) !== null && _b !== void 0 ? _b : 0;
            metadata.title = (_c = options.metadata.title) !== null && _c !== void 0 ? _c : '';
            metadata.subtitle = (_d = options.metadata.subtitle) !== null && _d !== void 0 ? _d : '';
            if (options.metadata.images) {
                metadata.images = options.metadata.images.map(img => new window.chrome.cast.Image(img.url));
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
        loadRequest.autoplay = (_e = options.autoPlay) !== null && _e !== void 0 ? _e : true;
        loadRequest.currentTime = (_f = options.currentTime) !== null && _f !== void 0 ? _f : 0;
        const error = await session.loadMedia(loadRequest);
        if (error) {
            throw new Error(`Failed to load media: ${error}`);
        }
        const mediaSession = session.getMediaSession();
        return this.createMediaObject(mediaSession, session.getSessionId());
    }
    async loadMediaWithHeaders(options) {
        // For web, headers can be passed via customData to be handled by the receiver
        const customData = Object.assign(Object.assign(Object.assign({}, options.customData), (options.authHeaders && { headers: options.authHeaders })), (options.authToken && { authToken: options.authToken }));
        return this.loadMedia(Object.assign(Object.assign({}, options), { customData }));
    }
    async mediaPause() {
        if (!this.remotePlayer || !this.remotePlayerController) {
            throw new Error('Cast not initialized');
        }
        if (!this.remotePlayer.isPaused) {
            this.remotePlayerController.playOrPause();
        }
    }
    async mediaPlay() {
        if (!this.remotePlayer || !this.remotePlayerController) {
            throw new Error('Cast not initialized');
        }
        if (this.remotePlayer.isPaused) {
            this.remotePlayerController.playOrPause();
        }
    }
    async mediaSeek(options) {
        if (!this.remotePlayer || !this.remotePlayerController) {
            throw new Error('Cast not initialized');
        }
        this.remotePlayer.currentTime = options.currentTime;
        this.remotePlayerController.seek();
    }
    async mediaNext() {
        var _a;
        const session = (_a = this.context) === null || _a === void 0 ? void 0 : _a.getCurrentSession();
        const mediaSession = session === null || session === void 0 ? void 0 : session.getMediaSession();
        if (!mediaSession) {
            throw new Error('No active media session');
        }
        return new Promise((resolve, reject) => {
            mediaSession.queueNext(() => resolve(), error => reject(new Error(error.description || 'Failed to skip to next')));
        });
    }
    async mediaPrev() {
        var _a;
        const session = (_a = this.context) === null || _a === void 0 ? void 0 : _a.getCurrentSession();
        const mediaSession = session === null || session === void 0 ? void 0 : session.getMediaSession();
        if (!mediaSession) {
            throw new Error('No active media session');
        }
        return new Promise((resolve, reject) => {
            mediaSession.queuePrev(() => resolve(), error => reject(new Error(error.description || 'Failed to go to previous')));
        });
    }
    async sessionStop() {
        if (this.context) {
            this.context.endCurrentSession(true);
        }
    }
    async sessionLeave() {
        if (this.context) {
            this.context.endCurrentSession(false);
        }
    }
    async startRouteScan(_options) {
        // Web Cast SDK does not support programmatic device scanning.
        // Device discovery is handled automatically by the browser's Cast button.
        // Return empty routes - use requestSession() to show the device picker.
        return { routes: [] };
    }
    async stopRouteScan() {
        // Web Cast SDK does not support programmatic device scanning.
        // This is a no-op on web.
    }
    async selectRoute(_options) {
        // Web Cast SDK does not support programmatic device selection.
        // Use requestSession() to show the device picker dialog instead.
        throw new Error('Programmatic device selection is not supported on web. Use requestSession() to show the device picker.');
    }
    async sendMessage(options) {
        var _a;
        const session = (_a = this.context) === null || _a === void 0 ? void 0 : _a.getCurrentSession();
        if (!session) {
            return { success: false, error: 'No active session' };
        }
        try {
            const parsedMessage = JSON.parse(options.message);
            await session.sendMessage(options.namespace, parsedMessage);
            return { success: true };
        }
        catch (e) {
            return {
                success: false,
                error: e instanceof Error ? e.message : 'Failed to send message',
            };
        }
    }
    async addMessageListener(options) {
        var _a;
        const session = (_a = this.context) === null || _a === void 0 ? void 0 : _a.getCurrentSession();
        // Create listener that emits events
        const listener = (namespace, message) => {
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
    async removeMessageListener(options) {
        var _a;
        const session = (_a = this.context) === null || _a === void 0 ? void 0 : _a.getCurrentSession();
        const listener = this.messageListeners.get(options.namespace);
        if (session && listener) {
            session.removeMessageListener(options.namespace, listener);
        }
        this.messageListeners.delete(options.namespace);
    }
    async networkDiagnostic() {
        return {
            networkConnected: navigator.onLine,
            networkType: 'unknown',
            isWiFi: true,
            castConnectionAvailable: !!this.context,
        };
    }
    createSessionObject(session) {
        const metadata = session.getApplicationMetadata();
        const device = session.getCastDevice();
        return {
            appId: (metadata === null || metadata === void 0 ? void 0 : metadata.applicationId) || this.appId,
            displayName: metadata === null || metadata === void 0 ? void 0 : metadata.name,
            sessionId: session.getSessionId() || '',
            receiver: {
                friendlyName: (device === null || device === void 0 ? void 0 : device.friendlyName) || '',
                label: (device === null || device === void 0 ? void 0 : device.label) || '',
                volume: {
                    level: session.getVolume() || 0,
                    muted: session.isMute() || false,
                },
            },
            media: [],
        };
    }
    createMediaObject(mediaSession, sessionId) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
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
        const playerStateMap = {
            [PlayerState.IDLE]: 'IDLE',
            [PlayerState.PLAYING]: 'PLAYING',
            [PlayerState.PAUSED]: 'PAUSED',
            [PlayerState.BUFFERING]: 'BUFFERING',
        };
        const idleReasonMap = {
            [IdleReason.CANCELLED]: 'CANCELLED',
            [IdleReason.ERROR]: 'ERROR',
            [IdleReason.FINISHED]: 'FINISHED',
            [IdleReason.INTERRUPTED]: 'INTERRUPTED',
        };
        const mediaInfo = mediaSession.media;
        const result = {
            currentItemId: mediaSession.currentItemId || 0,
            currentTime: (_c = (_b = (_a = mediaSession.getEstimatedTime) === null || _a === void 0 ? void 0 : _a.call(mediaSession)) !== null && _b !== void 0 ? _b : mediaSession.currentTime) !== null && _c !== void 0 ? _c : 0,
            customData: mediaSession.customData || {},
            mediaSessionId: mediaSession.mediaSessionId || 0,
            playbackRate: mediaSession.playbackRate || 1,
            playerState: playerStateMap[mediaSession.playerState] || 'UNKNOWN',
            isAlive: mediaSession.playerState !== PlayerState.IDLE,
            volume: {
                level: (_g = (_e = (_d = mediaSession.volume) === null || _d === void 0 ? void 0 : _d.level) !== null && _e !== void 0 ? _e : (_f = this.remotePlayer) === null || _f === void 0 ? void 0 : _f.volumeLevel) !== null && _g !== void 0 ? _g : 1,
                muted: (_l = (_j = (_h = mediaSession.volume) === null || _h === void 0 ? void 0 : _h.muted) !== null && _j !== void 0 ? _j : (_k = this.remotePlayer) === null || _k === void 0 ? void 0 : _k.isMuted) !== null && _l !== void 0 ? _l : false,
            },
            sessionId,
        };
        if (mediaSession.idleReason) {
            result.idleReason = idleReasonMap[mediaSession.idleReason];
        }
        if (mediaInfo) {
            const streamTypeMap = {
                [window.chrome.cast.media.StreamType.BUFFERED]: 'BUFFERED',
                [window.chrome.cast.media.StreamType.LIVE]: 'LIVE',
                [window.chrome.cast.media.StreamType.OTHER]: 'OTHER',
            };
            result.media = {
                contentId: mediaInfo.contentId,
                contentType: mediaInfo.contentType,
                customData: mediaInfo.customData || {},
                duration: (_m = mediaInfo.duration) !== null && _m !== void 0 ? _m : 0,
                streamType: streamTypeMap[mediaInfo.streamType] || 'BUFFERED',
            };
            if (mediaInfo.metadata) {
                result.media.metadata = {
                    metadataType: mediaInfo.metadata.metadataType,
                    title: mediaInfo.metadata.title,
                    subtitle: mediaInfo.metadata.subtitle,
                    images: (_o = mediaInfo.metadata.images) === null || _o === void 0 ? void 0 : _o.map(img => ({ url: img.url })),
                };
            }
        }
        return result;
    }
}
ChromecastWeb.DEFAULT_RECEIVER_APP_ID = 'CC1AD845';
ChromecastWeb.CAST_SENDER_SCRIPT_SRC = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';
ChromecastWeb.CAST_SDK_LOAD_TIMEOUT_MS = 10000;
ChromecastWeb.CAST_FRAMEWORK_READY_TIMEOUT_MS = 5000;
//# sourceMappingURL=web.js.map