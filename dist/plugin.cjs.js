'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var core = require('@capacitor/core');

// Singleton promise to prevent race conditions in Capacitor's loadPluginImplementation
let webInstancePromise = null;
const Chromecast = core.registerPlugin('KosmiCast', {
    web: () => {
        if (!webInstancePromise) {
            webInstancePromise = Promise.resolve().then(function () { return web; }).then(m => new m.ChromecastWeb());
        }
        return webInstancePromise;
    },
});

class ChromecastWeb extends core.WebPlugin {
    constructor() {
        super(...arguments);
        this.context = null;
        this.messageListeners = new Map();
        this.appId = '';
        this.contextSetup = false;
    }
    async initialize(options) {
        var _a;
        // Check if already loaded
        if ((_a = window.cast) === null || _a === void 0 ? void 0 : _a.framework) {
            this.setupCastContext(options);
            return;
        }
        const script = document.createElement('script');
        script.setAttribute('type', 'text/javascript');
        script.setAttribute('src', 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1');
        document.body.appendChild(script);
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Cast SDK load timeout'));
            }, 10000);
            window.__onGCastApiAvailable = (isAvailable) => {
                clearTimeout(timeout);
                if (isAvailable) {
                    // Wait for framework to be fully ready
                    const checkInterval = setInterval(() => {
                        var _a, _b;
                        if (((_a = window.cast) === null || _a === void 0 ? void 0 : _a.framework) && ((_b = window.chrome) === null || _b === void 0 ? void 0 : _b.cast)) {
                            clearInterval(checkInterval);
                            this.setupCastContext(options);
                            resolve();
                        }
                    }, 100);
                    setTimeout(() => {
                        var _a;
                        clearInterval(checkInterval);
                        if ((_a = window.cast) === null || _a === void 0 ? void 0 : _a.framework) {
                            this.setupCastContext(options);
                            resolve();
                        }
                        else {
                            reject(new Error('Cast framework not available'));
                        }
                    }, 5000);
                }
                else {
                    reject(new Error('Cast API not available'));
                }
            };
        });
    }
    setupCastContext(options) {
        // Guard against multiple setupCastContext calls
        if (this.contextSetup) {
            return;
        }
        this.contextSetup = true;
        const context = window.cast.framework.CastContext.getInstance();
        this.context = context;
        this.appId = (options === null || options === void 0 ? void 0 : options.appId) || '';
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
        // Listen for cast state changes (receiver availability)
        const { CastState } = window.cast.framework;
        context.addEventListener(window.cast.framework.CastContextEventType.CAST_STATE_CHANGED, (event) => {
            const castEvent = event;
            const available = castEvent.castState !== CastState.NO_DEVICES_AVAILABLE;
            this.notifyListeners('RECEIVER_LISTENER', { available });
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
        this.notifyListeners('RECEIVER_LISTENER', { available });
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
    async launchMedia(_options) {
        var _a;
        if (!((_a = this.context) === null || _a === void 0 ? void 0 : _a.getCurrentSession())) {
            throw new Error('No active session');
        }
        // For custom apps, use sendMessage instead of media loading
        // This is a simplified implementation
        return { success: true };
    }
    async loadMedia(_options) {
        throw new Error('Web implementation not available');
    }
    async loadMediaWithHeaders(_options) {
        throw new Error('Web implementation not available');
    }
    async mediaPause() {
        throw new Error('Web implementation not available');
    }
    async mediaPlay() {
        throw new Error('Web implementation not available');
    }
    async mediaSeek(_options) {
        throw new Error('Web implementation not available');
    }
    async mediaNext() {
        throw new Error('Web implementation not available');
    }
    async mediaPrev() {
        throw new Error('Web implementation not available');
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
        throw new Error('Web implementation not available');
    }
    async stopRouteScan() {
        throw new Error('Web implementation not available');
    }
    async selectRoute(_options) {
        throw new Error('Web implementation not available');
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
}

var web = /*#__PURE__*/Object.freeze({
    __proto__: null,
    ChromecastWeb: ChromecastWeb
});

exports.Chromecast = Chromecast;
//# sourceMappingURL=plugin.cjs.js.map
