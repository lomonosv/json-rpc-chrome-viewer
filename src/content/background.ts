import { MessageType, interceptorPortName } from '~/logic/common/messages';
import { enabledStorageKey, normaliseRules, rulesStorageKey } from '~/logic/Interceptor/rules';
import RegisteredContentScript = chrome.scripting.RegisteredContentScript;

chrome.runtime.onInstalled.addListener(async () => {
  const scripts = [{
    id: 'main-world',
    js: ['content/websockets.js', 'content/interceptor.js'],
    matches: ['*://*/*'],
    runAt: 'document_start',
    world: 'MAIN'
  }];

  await chrome.scripting.unregisterContentScripts().catch(() => {});
  await chrome.scripting.registerContentScripts(scripts as RegisteredContentScript[]).catch(() => {});
});

const panelPorts = new Map<number, chrome.runtime.Port>();

const resilientCaptureStorageKey = 'settings_resilientCapture';

const getInterceptorState = async (tabId: number) => {
  const stored = await chrome.storage.local.get([rulesStorageKey, enabledStorageKey, resilientCaptureStorageKey]);
  const isPanelOpen = panelPorts.has(tabId);

  return {
    rules: normaliseRules(stored[rulesStorageKey]),
    isEnabled: !!stored[enabledStorageKey] && isPanelOpen,
    isResilientCapture: !!stored[resilientCaptureStorageKey] && isPanelOpen
  };
};

const pushInterceptorState = async (tabId: number) => {
  const payload = await getInterceptorState(tabId);

  chrome.tabs.sendMessage(tabId, { type: MessageType.InterceptorState, payload }).catch(() => {});
};

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== interceptorPortName) {
    return;
  }

  port.onMessage.addListener(({ tabId }: { tabId: number }) => {
    panelPorts.set(tabId, port);
    pushInterceptorState(tabId);
  });

  port.onDisconnect.addListener(() => {
    panelPorts.forEach((openPort, tabId) => {
      if (openPort === port) {
        panelPorts.delete(tabId);
        pushInterceptorState(tabId);
      }
    });
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== MessageType.InterceptorStateRequest || !sender.tab) {
    return false;
  }

  getInterceptorState(sender.tab.id).then(sendResponse);

  return true;
});

chrome.storage.onChanged.addListener((changes, area) => {
  const isRelevantChange = rulesStorageKey in changes ||
    enabledStorageKey in changes ||
    resilientCaptureStorageKey in changes;

  if (area !== 'local' || !isRelevantChange) {
    return;
  }

  panelPorts.forEach((port, tabId) => pushInterceptorState(tabId));
});
