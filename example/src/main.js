import './styles.css';

import { Capacitor } from '@capacitor/core';
import { Chromecast } from '@strasberry/capacitor-chromecast';

const platformEl = document.querySelector('#platform');
const resultEl = document.querySelector('#result');
const logsEl = document.querySelector('#logs');

const appIdInput = document.querySelector('#appId');
const routeSelect = document.querySelector('#routeSelect');
const mediaUrlInput = document.querySelector('#mediaUrl');
const contentTypeInput = document.querySelector('#contentType');
const seekInput = document.querySelector('#seekInput');
const namespaceInput = document.querySelector('#namespaceInput');
const messageInput = document.querySelector('#messageInput');

const EVENT_NAMES = [
  'SESSION_LISTENER',
  'SESSION_UPDATE',
  'SESSION_STARTED',
  'SESSION_ENDED',
  'SESSION_RESUMED',
  'SESSION_START_FAILED',
  'RECEIVER_LISTENER',
  'MEDIA_LOAD',
  'MEDIA_UPDATE',
  'RECEIVER_MESSAGE',
  'SETUP',
];
let listenersRegistered = false;

platformEl.textContent = `Platform: ${Capacitor.getPlatform()}`;

function safeJson(value) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function pushLog(label, value) {
  const time = new Date().toLocaleTimeString();
  const line = `[${time}] ${label}\n${safeJson(value)}\n\n`;
  logsEl.textContent = line + logsEl.textContent;
}

function setResult(value) {
  resultEl.textContent = safeJson(value);
}

function updateRouteOptions(routes) {
  routeSelect.innerHTML = '';
  if (!routes.length) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'No routes returned';
    routeSelect.append(option);
    return;
  }

  routes.forEach(route => {
    const option = document.createElement('option');
    option.value = route.id;
    option.textContent = `${route.name} (${route.id})`;
    routeSelect.append(option);
  });
}

async function callPlugin(label, fn) {
  try {
    const data = await fn();
    setResult(data ?? { ok: true });
    pushLog(`${label}:success`, data ?? { ok: true });
    return data;
  } catch (error) {
    const normalized = {
      message: error instanceof Error ? error.message : String(error),
    };
    setResult({ error: normalized.message });
    pushLog(`${label}:error`, normalized);
    return null;
  }
}

function parseMessageJson() {
  const raw = messageInput.value.trim();
  if (!raw) {
    return '{}';
  }
  JSON.parse(raw);
  return raw;
}

async function setupEventListeners() {
  if (listenersRegistered) {
    return;
  }
  for (const eventName of EVENT_NAMES) {
    await Chromecast.addListener(eventName, payload => {
      pushLog(`event:${eventName}`, payload);
    });
  }
  listenersRegistered = true;
  pushLog('listeners', { registered: EVENT_NAMES });
}

document.querySelector('#initializeBtn').addEventListener('click', () => {
  callPlugin('initialize', async () => {
    await setupEventListeners();
    const appId = appIdInput.value.trim();
    await Chromecast.initialize({
      appId: appId || undefined,
      autoJoinPolicy: 'origin_scoped',
      defaultActionPolicy: 'create_session',
    });
    return { initialized: true, appId: appId || '(default receiver)' };
  });
});

document.querySelector('#networkBtn').addEventListener('click', () => {
  callPlugin('networkDiagnostic', () => Chromecast.networkDiagnostic());
});

document.querySelector('#requestSessionBtn').addEventListener('click', () => {
  callPlugin('requestSession', () => Chromecast.requestSession());
});

document.querySelector('#startScanBtn').addEventListener('click', () => {
  callPlugin('startRouteScan', async () => {
    const result = await Chromecast.startRouteScan({ timeout: 10 });
    updateRouteOptions(result.routes || []);
    return result;
  });
});

document.querySelector('#stopScanBtn').addEventListener('click', () => {
  callPlugin('stopRouteScan', async () => {
    await Chromecast.stopRouteScan();
    return { stopped: true };
  });
});

document.querySelector('#selectRouteBtn').addEventListener('click', () => {
  callPlugin('selectRoute', () => {
    const routeId = routeSelect.value;
    if (!routeId) {
      throw new Error('No route selected');
    }
    return Chromecast.selectRoute({ routeId });
  });
});

document.querySelector('#sessionLeaveBtn').addEventListener('click', () => {
  callPlugin('sessionLeave', async () => {
    await Chromecast.sessionLeave();
    return { left: true };
  });
});

document.querySelector('#sessionStopBtn').addEventListener('click', () => {
  callPlugin('sessionStop', async () => {
    await Chromecast.sessionStop();
    return { stopped: true };
  });
});

document.querySelector('#launchMediaBtn').addEventListener('click', () => {
  callPlugin('launchMedia', () =>
    Chromecast.launchMedia({ mediaUrl: mediaUrlInput.value.trim() }),
  );
});

document.querySelector('#loadMediaBtn').addEventListener('click', () => {
  callPlugin('loadMedia', () =>
    Chromecast.loadMedia({
      contentId: mediaUrlInput.value.trim(),
      contentType: contentTypeInput.value.trim() || 'video/mp4',
      autoPlay: true,
      currentTime: 0,
      streamType: 'BUFFERED',
      metadata: {
        title: 'Big Buck Bunny',
        subtitle: 'Capacitor Chromecast Example',
        images: [
          {
            url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
          },
        ],
      },
    }),
  );
});

document.querySelector('#mediaPlayBtn').addEventListener('click', () => {
  callPlugin('mediaPlay', async () => {
    await Chromecast.mediaPlay();
    return { playing: true };
  });
});

document.querySelector('#mediaPauseBtn').addEventListener('click', () => {
  callPlugin('mediaPause', async () => {
    await Chromecast.mediaPause();
    return { paused: true };
  });
});

document.querySelector('#mediaPrevBtn').addEventListener('click', () => {
  callPlugin('mediaPrev', async () => {
    await Chromecast.mediaPrev();
    return { previous: true };
  });
});

document.querySelector('#mediaNextBtn').addEventListener('click', () => {
  callPlugin('mediaNext', async () => {
    await Chromecast.mediaNext();
    return { next: true };
  });
});

document.querySelector('#mediaSeekBtn').addEventListener('click', () => {
  callPlugin('mediaSeek', async () => {
    const currentTime = Number(seekInput.value);
    if (!Number.isFinite(currentTime) || currentTime < 0) {
      throw new Error('Seek value must be a positive number');
    }
    await Chromecast.mediaSeek({ currentTime });
    return { seekTo: currentTime };
  });
});

document
  .querySelector('#addMessageListenerBtn')
  .addEventListener('click', () => {
    callPlugin('addMessageListener', async () => {
      const namespace = namespaceInput.value.trim();
      if (!namespace) {
        throw new Error('Namespace is required');
      }
      await Chromecast.addMessageListener({ namespace });
      return { namespace, listening: true };
    });
  });

document
  .querySelector('#removeMessageListenerBtn')
  .addEventListener('click', () => {
    callPlugin('removeMessageListener', async () => {
      const namespace = namespaceInput.value.trim();
      if (!namespace) {
        throw new Error('Namespace is required');
      }
      await Chromecast.removeMessageListener({ namespace });
      return { namespace, listening: false };
    });
  });

document.querySelector('#sendMessageBtn').addEventListener('click', () => {
  callPlugin('sendMessage', () => {
    const namespace = namespaceInput.value.trim();
    if (!namespace) {
      throw new Error('Namespace is required');
    }
    return Chromecast.sendMessage({
      namespace,
      message: parseMessageJson(),
    });
  });
});

document.querySelector('#clearLogsBtn').addEventListener('click', () => {
  logsEl.textContent = '';
  setResult('(cleared)');
});

setResult({
  ready: true,
  tip: 'Press Initialize first, then Request Session.',
});
pushLog('boot', { ready: true });
