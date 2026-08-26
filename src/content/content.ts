import { MessageType } from '~/logic/common/messages';

const relayedTypes: string[] = [
  MessageType.WebsocketMessage,
  MessageType.InterceptedRequest
];

const disarmedState = { rules: [], isEnabled: false };

const isExtensionAlive = () => !!chrome.runtime?.id;

const postInterceptorRules = (payload: object) => {
  window.postMessage({ type: MessageType.InterceptorRules, payload }, '*');
};

const requestInterceptorState = () => {
  if (!isExtensionAlive()) {
    postInterceptorRules(disarmedState);

    return;
  }

  chrome.runtime.sendMessage({ type: MessageType.InterceptorStateRequest }, (state) => {
    postInterceptorRules(chrome.runtime.lastError || !state ? disarmedState : state);
  });
};

window.addEventListener('message', (event) => {
  if (event.source !== window || !relayedTypes.includes(event.data?.type)) return;
  if (!isExtensionAlive()) return;

  chrome.runtime.sendMessage({ type: event.data.type, payload: event.data.payload }, () => {
    chrome.runtime.lastError;
  });
});

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === MessageType.InterceptorState) {
    postInterceptorRules(message.payload);
  }
});

requestInterceptorState();
