import RegisteredContentScript = chrome.scripting.RegisteredContentScript;

chrome.runtime.onInstalled.addListener(async () => {
  const scripts = [{
    id: 'websockets',
    js: ['content/websockets.js'],
    matches: ['*://*/*'],
    runAt: 'document_start',
    world: 'MAIN'
  }];
  const ids = scripts.map((s) => s.id);

  await chrome.scripting.unregisterContentScripts({ ids }).catch(() => {});
  await chrome.scripting.registerContentScripts(scripts as RegisteredContentScript[]).catch(() => {});
});
