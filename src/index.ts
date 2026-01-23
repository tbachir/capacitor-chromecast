import { registerPlugin } from '@capacitor/core';

import type { ChromecastPlugin } from './definitions';

// Singleton promise to prevent race conditions in Capacitor's loadPluginImplementation
let webInstancePromise: Promise<import('./web').ChromecastWeb> | null = null;

const Chromecast = registerPlugin<ChromecastPlugin>('CapChromecast', {
  web: () => {
    if (!webInstancePromise) {
      webInstancePromise = import('./web').then(m => new m.ChromecastWeb());
    }
    return webInstancePromise;
  },
});

export * from './definitions';
export { Chromecast };
