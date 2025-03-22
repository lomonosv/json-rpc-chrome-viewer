window.addEventListener('message', (event) => {
  if (event.source !== window || !event.data.type) return;

  if (event.data.type === 'JSON_RPC_WEBSOCKET_MESSAGE') {
    chrome.runtime.sendMessage({ type: 'JSON_RPC_WEBSOCKET_MESSAGE', payload: event.data.payload });
  }
});
