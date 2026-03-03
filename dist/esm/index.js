import { Capacitor, registerPlugin } from '@capacitor/core';
// Singleton promise to prevent race conditions in Capacitor's loadPluginImplementation
let webInstancePromise = null;
const ChromecastBase = registerPlugin('Chromecast', {
    web: () => {
        if (!webInstancePromise) {
            webInstancePromise = import('./web').then(m => new m.ChromecastWeb());
        }
        return webInstancePromise;
    },
});
let autoInitializeInFlight = null;
let autoInitListenersRegistered = false;
const isAutoInitializeEnabled = () => {
    var _a, _b, _c, _d;
    const configuredValue = (_d = (_c = (_b = (_a = globalThis.Capacitor) === null || _a === void 0 ? void 0 : _a.config) === null || _b === void 0 ? void 0 : _b.plugins) === null || _c === void 0 ? void 0 : _c.Chromecast) === null || _d === void 0 ? void 0 : _d.autoInitialize;
    return configuredValue !== false;
};
const autoInitializeEnabled = isAutoInitializeEnabled();
const initializeBase = (options) => ChromecastBase.initialize(options);
const initializeAndTrack = (options) => {
    autoInitializeInFlight = initializeBase(options).catch(error => {
        autoInitializeInFlight = null;
        throw error;
    });
    return autoInitializeInFlight;
};
const autoInitialize = (force = false) => {
    if (force) {
        autoInitializeInFlight = null;
    }
    if (!autoInitializeInFlight) {
        autoInitializeInFlight = initializeAndTrack();
    }
    return autoInitializeInFlight;
};
const setupAutoInitialize = () => {
    if (!autoInitializeEnabled ||
        autoInitListenersRegistered ||
        typeof document === 'undefined') {
        return;
    }
    autoInitListenersRegistered = true;
    const triggerAutoInitialize = (force = false) => {
        void autoInitialize(force).catch(error => {
            // Keep app flow alive even if Cast SDK isn't available on the current device/browser.
            console.warn('[Chromecast] auto-initialize failed:', error);
        });
    };
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => triggerAutoInitialize(), { once: true });
    }
    else {
        triggerAutoInitialize();
    }
    // Native Capacitor apps emit "resume" on document when returning from background.
    document.addEventListener('resume', () => triggerAutoInitialize(true));
    // Browser fallback for web platform where "resume" event is not available.
    if (Capacitor.getPlatform() === 'web') {
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                triggerAutoInitialize(true);
            }
        });
    }
};
const methodsWithoutAutoInit = new Set([
    'initialize',
    'addListener',
    'removeAllListeners',
]);
const Chromecast = new Proxy(ChromecastBase, {
    get(target, prop, receiver) {
        const original = Reflect.get(target, prop, receiver);
        if (typeof original !== 'function') {
            return original;
        }
        if (prop === 'initialize') {
            return (options) => initializeAndTrack(options);
        }
        if (methodsWithoutAutoInit.has(prop)) {
            return original.bind(target);
        }
        return async (...args) => {
            if (!autoInitializeEnabled) {
                return original.apply(target, args);
            }
            await autoInitialize();
            return original.apply(target, args);
        };
    },
});
setupAutoInitialize();
export * from './definitions';
export { Chromecast };
//# sourceMappingURL=index.js.map