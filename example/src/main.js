import './styles.css';

import { Capacitor } from '@capacitor/core';
import { Chromecast } from '@strasberry/capacitor-chromecast';

const platformEl = document.querySelector('#platform');
const resultEl = document.querySelector('#result');
const logsEl = document.querySelector('#logs');

const routeSelect = document.querySelector('#routeSelect');
const mediaUrlInput = document.querySelector('#mediaUrl');
const contentTypeInput = document.querySelector('#contentType');
const seekInput = document.querySelector('#seekInput');
const namespaceInput = document.querySelector('#namespaceInput');
const messageInput = document.querySelector('#messageInput');
const mimeitSequenceBtn = document.querySelector('#mimeitSequenceBtn');

const MIMEIT_DEMO = Object.freeze({
  receiverUrl: 'https://cast.mimeit.com',
  namespace: 'urn:x-cast:com.mimeit.state',
});

const MIMEIT_STATES = Object.freeze({
  IDLE: {
    scene: 'IDLE',
    payload: { appName: 'Mime It' },
  },
  NEXT_PLAYER: {
    scene: 'NEXT_PLAYER',
    payload: {
      playerName: 'Alice',
      roundIndex: 1,
      roundsCount: 3,
      turnIndex: 1,
      turnsCount: 4,
    },
  },
  TURN_RUNNING: {
    scene: 'TURN_RUNNING',
    payload: {
      remainingSeconds: 42,
      totalSeconds: 60,
      isCritical: false,
    },
  },
  GAME_RESULTS: {
    scene: 'GAME_RESULTS',
    payload: {
      winnerName: 'Team Rouge',
      soloScores: [
        {
          rank: 1,
          playerName: 'Alice',
          score: 14,
          mimedParts: 9,
          guessedParts: 5,
        },
        {
          rank: 2,
          playerName: 'Bob',
          score: 11,
          mimedParts: 7,
          guessedParts: 4,
        },
      ],
      teamScores: [
        {
          rank: 1,
          teamName: 'Team Rouge',
          score: 25,
          players: [
            { rank: 1, playerName: 'Alice', mimedParts: 9 },
            { rank: 2, playerName: 'Bob', mimedParts: 7 },
          ],
        },
        {
          rank: 2,
          teamName: 'Team Bleu',
          score: 19,
          players: [
            { rank: 3, playerName: 'Chloe', mimedParts: 6 },
            { rank: 4, playerName: 'David', mimedParts: 5 },
          ],
        },
      ],
    },
  },
});

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
let isInitialized = false;
let mimeItSequenceRunning = false;

const platform = Capacitor.getPlatform();
platformEl.textContent = `Platform: ${platform}`;

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

function setMessageJson(value) {
  messageInput.value = JSON.stringify(value, null, 2);
}

function buildMimeItSyncStateMessage(scene) {
  const state = MIMEIT_STATES[scene];
  if (!state) {
    throw new Error(`Unsupported MimeIt scene: ${scene}`);
  }
  return {
    type: 'SYNC_STATE',
    version: '1',
    payload: state,
  };
}

function applyMimeItPreset() {
  namespaceInput.value = MIMEIT_DEMO.namespace;
  setMessageJson(buildMimeItSyncStateMessage('IDLE'));
  return {
    namespace: MIMEIT_DEMO.namespace,
    receiverUrl: MIMEIT_DEMO.receiverUrl,
  };
}

function sendMimeItMessage(label, message) {
  const namespace = namespaceInput.value.trim() || MIMEIT_DEMO.namespace;
  if (!namespaceInput.value.trim()) {
    namespaceInput.value = namespace;
  }
  setMessageJson(message);
  return callPlugin(label, () =>
    Chromecast.sendMessage({
      namespace,
      message: JSON.stringify(message),
    }),
  );
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function setMimeItSequenceUi(isRunning) {
  if (!mimeitSequenceBtn) {
    return;
  }
  mimeitSequenceBtn.disabled = isRunning;
  mimeitSequenceBtn.textContent = isRunning
    ? 'MimeIt Sequence Running...'
    : 'Run MimeIt Demo Sequence';
}

async function runMimeItDemoSequence() {
  if (mimeItSequenceRunning) {
    throw new Error('MimeIt demo sequence is already running');
  }

  const steps = [
    {
      label: 'mimeitSeqReset',
      message: { type: 'RESET', version: '1' },
      waitAfterMs: 700,
    },
    {
      label: 'mimeitSeqNextPlayer',
      message: buildMimeItSyncStateMessage('NEXT_PLAYER'),
      waitAfterMs: 1500,
    },
    {
      label: 'mimeitSeqTurnRunning',
      message: buildMimeItSyncStateMessage('TURN_RUNNING'),
      waitAfterMs: 2200,
    },
    {
      label: 'mimeitSeqHeartbeat',
      message: { type: 'HEARTBEAT', version: '1' },
      waitAfterMs: 700,
    },
    {
      label: 'mimeitSeqResults',
      message: buildMimeItSyncStateMessage('GAME_RESULTS'),
      waitAfterMs: 0,
    },
  ];

  mimeItSequenceRunning = true;
  setMimeItSequenceUi(true);
  pushLog('mimeit:sequence:start', {
    steps: steps.map(step => step.label),
  });

  const completedSteps = [];
  try {
    for (const step of steps) {
      const result = await sendMimeItMessage(step.label, step.message);
      if (!result || result.success === false) {
        throw new Error(result?.error || `Failed at step: ${step.label}`);
      }
      completedSteps.push(step.label);
      if (step.waitAfterMs > 0) {
        await sleep(step.waitAfterMs);
      }
    }

    const summary = {
      completed: true,
      steps: completedSteps,
    };
    setResult(summary);
    pushLog('mimeit:sequence:done', summary);
    return summary;
  } finally {
    mimeItSequenceRunning = false;
    setMimeItSequenceUi(false);
  }
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

    if (platform === 'ios' && isInitialized) {
      return {
        initialized: true,
        note: 'Already initialized on iOS for this app launch.',
      };
    }

    await Chromecast.initialize({
      autoJoinPolicy: 'origin_scoped',
      defaultActionPolicy: 'create_session',
    });
    isInitialized = true;
    return {
      initialized: true,
      note: 'App ID comes from capacitor.config.* (or plugin default if not configured).',
    };
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

document.querySelector('#mimeitPresetBtn').addEventListener('click', () => {
  const preset = applyMimeItPreset();
  setResult({ presetApplied: true, ...preset });
  pushLog('mimeit:preset', preset);
});

document.querySelector('#mimeitOpenReceiverBtn').addEventListener('click', () => {
  window.open(MIMEIT_DEMO.receiverUrl, '_blank', 'noopener,noreferrer');
  pushLog('mimeit:receiver', { url: MIMEIT_DEMO.receiverUrl });
});

document.querySelector('#mimeitResetBtn').addEventListener('click', () => {
  sendMimeItMessage('mimeitReset', { type: 'RESET', version: '1' });
});

document.querySelector('#mimeitHeartbeatBtn').addEventListener('click', () => {
  sendMimeItMessage('mimeitHeartbeat', {
    type: 'HEARTBEAT',
    version: '1',
  });
});

document.querySelector('#mimeitIdleBtn').addEventListener('click', () => {
  sendMimeItMessage('mimeitIdle', buildMimeItSyncStateMessage('IDLE'));
});

document.querySelector('#mimeitNextPlayerBtn').addEventListener('click', () => {
  sendMimeItMessage(
    'mimeitNextPlayer',
    buildMimeItSyncStateMessage('NEXT_PLAYER'),
  );
});

document.querySelector('#mimeitTurnRunningBtn').addEventListener('click', () => {
  sendMimeItMessage(
    'mimeitTurnRunning',
    buildMimeItSyncStateMessage('TURN_RUNNING'),
  );
});

document.querySelector('#mimeitResultsBtn').addEventListener('click', () => {
  sendMimeItMessage(
    'mimeitResults',
    buildMimeItSyncStateMessage('GAME_RESULTS'),
  );
});

document.querySelector('#mimeitSequenceBtn').addEventListener('click', () => {
  callPlugin('mimeitSequence', () => runMimeItDemoSequence());
});

document.querySelector('#clearLogsBtn').addEventListener('click', () => {
  logsEl.textContent = '';
  setResult('(cleared)');
});

setResult({
  ready: true,
  tip: 'Press Initialize first, then Request Session. Use "Apply MimeIt Preset" for FB38EA42.',
});
pushLog('boot', { ready: true });
setMimeItSequenceUi(false);
