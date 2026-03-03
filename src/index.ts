import { Capacitor, registerPlugin } from '@capacitor/core';

import type { ChromecastPlugin, InitializeOptions } from './definitions';

// Singleton promise to prevent race conditions in Capacitor's loadPluginImplementation
let webInstancePromise: Promise<import('./web').ChromecastWeb> | null = null;

const ChromecastBase = registerPlugin<ChromecastPlugin>('Chromecast', {
  web: () => {
    if (!webInstancePromise) {
      webInstancePromise = import('./web').then(m => new m.ChromecastWeb());
    }
    return webInstancePromise;
  },
});

let autoInitializeInFlight: Promise<void> | null = null;
let autoInitListenersRegistered = false;

const isAutoInitializeEnabled = (): boolean => {
  const configuredValue = (
    globalThis as typeof globalThis & {
      Capacitor?: {
        config?: {
          plugins?: {
            Chromecast?: {
              autoInitialize?: boolean;
            };
          };
        };
      };
    }
  ).Capacitor?.config?.plugins?.Chromecast?.autoInitialize;

  return configuredValue !== false;
};

const autoInitializeEnabled = isAutoInitializeEnabled();

const initializeBase = (options?: InitializeOptions): Promise<void> =>
  ChromecastBase.initialize(options);

const initializeAndTrack = (options?: InitializeOptions): Promise<void> => {
  autoInitializeInFlight = initializeBase(options).catch(error => {
    autoInitializeInFlight = null;
    throw error;
  });
  return autoInitializeInFlight;
};

const autoInitialize = (force = false): Promise<void> => {
  if (force) {
    autoInitializeInFlight = null;
  }

  if (!autoInitializeInFlight) {
    autoInitializeInFlight = initializeAndTrack();
  }

  return autoInitializeInFlight;
};

const setupAutoInitialize = (): void => {
  if (
    !autoInitializeEnabled ||
    autoInitListenersRegistered ||
    typeof document === 'undefined'
  ) {
    return;
  }

  autoInitListenersRegistered = true;

  const triggerAutoInitialize = (force = false): void => {
    void autoInitialize(force).catch(error => {
      // Keep app flow alive even if Cast SDK isn't available on the current device/browser.
      console.warn('[Chromecast] auto-initialize failed:', error);
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      () => triggerAutoInitialize(),
      { once: true },
    );
  } else {
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

const methodsWithoutAutoInit = new Set<PropertyKey>([
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
      return (options?: InitializeOptions) => initializeAndTrack(options);
    }

    if (methodsWithoutAutoInit.has(prop)) {
      return original.bind(target);
    }

    return async (...args: unknown[]) => {
      if (!autoInitializeEnabled) {
        return original.apply(target, args);
      }
      await autoInitialize();
      return original.apply(target, args);
    };
  },
}) as ChromecastPlugin;

setupAutoInitialize();

export * from './definitions';
export { Chromecast };
