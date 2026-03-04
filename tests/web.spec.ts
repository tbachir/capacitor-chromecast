import { Capacitor } from '@capacitor/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ChromecastWeb } from '../src/web';

const CAST_SENDER_SCRIPT_SRC =
  'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';

const setupCastFramework = () => {
  const context = {
    setOptions: vi.fn(),
    getCastState: vi.fn(() => 'NOT_CONNECTED'),
    getCurrentSession: vi.fn(() => null),
    requestSession: vi.fn(async () => undefined),
    endCurrentSession: vi.fn(),
    addEventListener: vi.fn(),
  };

  ((window as unknown) as { cast: unknown }).cast = {
    framework: {
      CastContext: {
        getInstance: () => context,
      },
      CastContextEventType: {
        CAST_STATE_CHANGED: 'CAST_STATE_CHANGED',
        SESSION_STATE_CHANGED: 'SESSION_STATE_CHANGED',
      },
      CastState: {
        NO_DEVICES_AVAILABLE: 'NO_DEVICES_AVAILABLE',
        NOT_CONNECTED: 'NOT_CONNECTED',
        CONNECTING: 'CONNECTING',
        CONNECTED: 'CONNECTED',
      },
      SessionState: {
        SESSION_STARTED: 'SESSION_STARTED',
        SESSION_RESUMED: 'SESSION_RESUMED',
        SESSION_ENDED: 'SESSION_ENDED',
        SESSION_ENDING: 'SESSION_ENDING',
      },
      RemotePlayerEventType: {
        ANY_CHANGE: 'ANY_CHANGE',
        IS_PAUSED_CHANGED: 'IS_PAUSED_CHANGED',
        CURRENT_TIME_CHANGED: 'CURRENT_TIME_CHANGED',
        PLAYER_STATE_CHANGED: 'PLAYER_STATE_CHANGED',
      },
      RemotePlayer: class MockRemotePlayer {},
      RemotePlayerController: class MockRemotePlayerController {
        constructor(_player: unknown) {}
      },
    },
  };

  ((window as unknown) as { chrome: unknown }).chrome = {
    cast: {
      AutoJoinPolicy: {
        TAB_AND_ORIGIN_SCOPED: 'tab_and_origin_scoped',
        ORIGIN_SCOPED: 'origin_scoped',
        PAGE_SCOPED: 'page_scoped',
      },
    },
  };

  return context;
};

describe('ChromecastWeb initialize', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(Capacitor, 'getPlatform').mockReturnValue('web');
    Object.defineProperty(window, 'isSecureContext', {
      value: true,
      configurable: true,
    });

    delete ((window as unknown) as { __onGCastApiAvailable?: unknown })
      .__onGCastApiAvailable;
    delete ((window as unknown) as { cast?: unknown }).cast;
    delete ((window as unknown) as { chrome?: unknown }).chrome;

    document.head.innerHTML = '';
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sets __onGCastApiAvailable before script injection', async () => {
    const plugin = new ChromecastWeb();
    let callbackDefinedAtAppend = false;
    const originalAppend = document.body.appendChild.bind(document.body);

    const appendSpy = vi
      .spyOn(document.body, 'appendChild')
      .mockImplementation((node: Node) => {
        callbackDefinedAtAppend =
          typeof window.__onGCastApiAvailable === 'function';
        return originalAppend(node);
      });

    const initializePromise = plugin.initialize();

    expect(appendSpy).toHaveBeenCalledTimes(1);
    expect(callbackDefinedAtAppend).toBe(true);

    setupCastFramework();
    window.__onGCastApiAvailable?.(true);

    await initializePromise;
    expect(
      document.querySelectorAll(`script[src="${CAST_SENDER_SCRIPT_SRC}"]`),
    ).toHaveLength(1);
  });

  it('reuses a singleton load promise for concurrent initialize calls', async () => {
    const plugin = new ChromecastWeb();

    const firstCall = plugin.initialize();
    const secondCall = plugin.initialize();

    expect(
      document.querySelectorAll(`script[src="${CAST_SENDER_SCRIPT_SRC}"]`),
    ).toHaveLength(1);

    setupCastFramework();
    window.__onGCastApiAvailable?.(true);

    await Promise.all([firstCall, secondCall]);
  });

  it('rejects when Cast API callback reports unavailable', async () => {
    const plugin = new ChromecastWeb();

    const initializePromise = plugin.initialize();
    window.__onGCastApiAvailable?.(false);

    await expect(initializePromise).rejects.toThrow('Cast API not available');
  });

  it('rejects insecure http origin outside localhost', async () => {
    Object.defineProperty(window, 'isSecureContext', {
      value: false,
      configurable: true,
    });
    vi.spyOn(window, 'location', 'get').mockReturnValue({
      protocol: 'http:',
      hostname: 'example.com',
    } as Location);

    const plugin = new ChromecastWeb();

    await expect(plugin.initialize()).rejects.toThrow(
      'requires a secure context',
    );
    expect(
      document.querySelector(`script[src="${CAST_SENDER_SCRIPT_SRC}"]`),
    ).toBeNull();
  });

  it('rejects iOS browser user agents for web sender', async () => {
    vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/124.0.0.0 Mobile/15E148 Safari/604.1',
    );
    vi.spyOn(window.navigator, 'platform', 'get').mockReturnValue('iPhone');

    const plugin = new ChromecastWeb();

    await expect(plugin.initialize()).rejects.toThrow(
      'not supported on iOS browsers',
    );
    expect(
      document.querySelector(`script[src="${CAST_SENDER_SCRIPT_SRC}"]`),
    ).toBeNull();
  });

  it('allows desktop Chrome iPhone emulation (spoofed iOS platform)', async () => {
    vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/124.0.0.0 Mobile/15E148 Safari/604.1',
    );
    vi.spyOn(window.navigator, 'platform', 'get').mockReturnValue('iPhone');
    ((window as unknown) as { chrome: { runtime: object } }).chrome = {
      runtime: {},
    };

    const plugin = new ChromecastWeb();
    const initPromise = plugin.initialize();

    window.__onGCastApiAvailable?.(false);

    await expect(initPromise).rejects.toThrow('Cast API not available');
  });

  it('rejects iPad on iOS 13+ identified by MacIntel platform and touch points', async () => {
    vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
    );
    vi.spyOn(window.navigator, 'platform', 'get').mockReturnValue('MacIntel');
    Object.defineProperty(window.navigator, 'maxTouchPoints', {
      value: 5,
      configurable: true,
    });
    // window.chrome is deleted in beforeEach — real iPad does not have it

    const plugin = new ChromecastWeb();

    await expect(plugin.initialize()).rejects.toThrow(
      'not supported on iOS browsers',
    );
  });

  it('allows Chrome desktop with DevTools iOS emulation active', async () => {
    vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    );
    vi.spyOn(window.navigator, 'platform', 'get').mockReturnValue('MacIntel');
    Object.defineProperty(window.navigator, 'maxTouchPoints', {
      value: 5,
      configurable: true,
    });
    ((window as unknown) as { chrome: { runtime: object } }).chrome = {
      runtime: {},
    };

    const plugin = new ChromecastWeb();
    const initPromise = plugin.initialize();

    // Trigger Cast API unavailable to resolve the promise — the important
    // thing is that the iOS guard did not throw synchronously before this point
    window.__onGCastApiAvailable?.(false);

    await expect(initPromise).rejects.toThrow('Cast API not available');
  });

  it('allows desktop Mac without touch points', async () => {
    vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    );
    vi.spyOn(window.navigator, 'platform', 'get').mockReturnValue('MacIntel');
    Object.defineProperty(window.navigator, 'maxTouchPoints', {
      value: 0,
      configurable: true,
    });
    ((window as unknown) as { chrome: { runtime: object } }).chrome = {
      runtime: {},
    };

    const plugin = new ChromecastWeb();
    const initPromise = plugin.initialize();

    window.__onGCastApiAvailable?.(false);

    await expect(initPromise).rejects.toThrow('Cast API not available');
  });

  it('reports a native fallback misconfiguration on non-web platforms', async () => {
    vi.spyOn(Capacitor, 'getPlatform').mockReturnValue('android');

    const plugin = new ChromecastWeb();

    await expect(plugin.initialize()).rejects.toThrow(
      'Native plugin may be missing',
    );
    expect(
      document.querySelector(`script[src="${CAST_SENDER_SCRIPT_SRC}"]`),
    ).toBeNull();
  });
});
