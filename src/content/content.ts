const postMockRules = () => {
  chrome.storage.local.get(['mockRules', 'mocksEnabled'], (result) => {
    if (chrome.runtime.lastError) return;

    window.postMessage({
      type: 'JSON_RPC_MOCK_RULES',
      payload: {
        rules: result.mockRules || [],
        enabled: !!result.mocksEnabled
      }
    }, '*');
  });
};

window.addEventListener('message', (event) => {
  if (event.source !== window || !event.data.type) return;

  if (event.data.type === 'JSON_RPC_WEBSOCKET_MESSAGE') {
    chrome.runtime.sendMessage({ type: 'JSON_RPC_WEBSOCKET_MESSAGE', payload: event.data.payload }, () => {
      chrome.runtime.lastError;
    });
  }

  if (event.data.type === 'JSON_RPC_MOCKED_REQUEST') {
    chrome.runtime.sendMessage({ type: 'JSON_RPC_MOCKED_REQUEST', payload: event.data.payload }, () => {
      chrome.runtime.lastError;
    });
  }
});

// The MAIN-world patch cannot read chrome.storage, so the rules are pushed to it from here —
// once on load, then again whenever the panel edits them.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && ('mockRules' in changes || 'mocksEnabled' in changes)) {
    postMockRules();
  }
});

postMockRules();
