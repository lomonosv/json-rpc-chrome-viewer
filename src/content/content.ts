const script = document.createElement('script');

script.id = 'websockets-interceptor';
script.fetchPriority = 'high';

(document.head || document.documentElement).appendChild(script);

script.onload = () => {
  script.parentNode.removeChild(script);
};

script.src = chrome.runtime.getURL('content/websockets.js');

window.addEventListener('message', (event) => {
  if (event.source !== window || !event.data.type) return;

  if (event.data.type === 'JSON_RPC_WEBSOCKET_MESSAGE') {
    console.log('Intercepted WebSocket Message:', event.data.payload);

    chrome.runtime.sendMessage({ type: 'JSON_RPC_WEBSOCKET_MESSAGE', payload: event.data.payload });
  }
});
