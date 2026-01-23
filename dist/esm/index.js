import { registerPlugin } from '@capacitor/core';
// Singleton promise to prevent race conditions in Capacitor's loadPluginImplementation
let webInstancePromise = null;
const Chromecast = registerPlugin('KosmiCast', {
    web: () => {
        if (!webInstancePromise) {
            webInstancePromise = import('./web').then(m => new m.ChromecastWeb());
        }
        return webInstancePromise;
    },
});
export * from './definitions';
export { Chromecast };
//# sourceMappingURL=index.js.map