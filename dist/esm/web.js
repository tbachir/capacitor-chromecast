import { WebPlugin } from '@capacitor/core';
export class ChromecastWeb extends WebPlugin {
    async initialize(options) {
        const script = document.createElement('script');
        script.setAttribute('type', 'text/javascript');
        script.setAttribute('src', 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1');
        document.body.appendChild(script);
        return new Promise((resolve, reject) => {
            window.__onGCastApiAvailable = (isAvailable) => {
                if (isAvailable) {
                    this.cast = window.chrome.cast;
                    const sessionRequest = new this.cast.SessionRequest((options === null || options === void 0 ? void 0 : options.appId) || this.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID);
                    const apiConfig = new this.cast.ApiConfig(sessionRequest, () => {
                        // Session listener
                    }, () => {
                        // Receiver listener
                    });
                    this.cast.initialize(apiConfig, () => resolve(), (err) => reject(err));
                }
                else {
                    reject(new Error('Cast API not available'));
                }
            };
        });
    }
    async requestSession() {
        return new Promise((resolve, reject) => {
            this.cast.requestSession((session) => {
                this.session = session;
                resolve(this.createSessionObject(session));
            }, (err) => reject(err));
        });
    }
    async launchMedia(options) {
        if (!this.session) {
            throw new Error('No active session');
        }
        const mediaInfo = new this.cast.media.MediaInfo(options.mediaUrl);
        const request = new this.cast.media.LoadRequest(mediaInfo);
        return new Promise((resolve, reject) => {
            this.session.loadMedia(request, () => resolve({ success: true }), (err) => reject(err));
        });
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
        if (this.session) {
            this.session.stop();
            this.session = null;
        }
    }
    async sessionLeave() {
        if (this.session) {
            this.session.leave();
            this.session = null;
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
    async sendMessage(_options) {
        throw new Error('Web implementation not available');
    }
    async addMessageListener(_options) {
        throw new Error('Web implementation not available');
    }
    async networkDiagnostic() {
        return {
            networkConnected: navigator.onLine,
            networkType: 'unknown',
            isWiFi: true,
            castConnectionAvailable: !!this.cast,
        };
    }
    createSessionObject(session) {
        var _a, _b, _c, _d, _e, _f;
        return {
            appId: session.appId || '',
            sessionId: session.sessionId || '',
            receiver: {
                friendlyName: ((_a = session.receiver) === null || _a === void 0 ? void 0 : _a.friendlyName) || '',
                label: ((_b = session.receiver) === null || _b === void 0 ? void 0 : _b.label) || '',
                volume: {
                    level: ((_d = (_c = session.receiver) === null || _c === void 0 ? void 0 : _c.volume) === null || _d === void 0 ? void 0 : _d.level) || 0,
                    muted: ((_f = (_e = session.receiver) === null || _e === void 0 ? void 0 : _e.volume) === null || _f === void 0 ? void 0 : _f.muted) || false,
                },
            },
            media: [],
        };
    }
}
//# sourceMappingURL=web.js.map