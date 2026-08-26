import { MessageType } from '~/logic/common/messages';

(function overrideWebSocket() {
  class InterceptedWebSocket extends WebSocket {
    constructor(url: string, protocols?: string | string[]) {
      super(url, protocols);

      this.addEventListener('message', (event) => {
        window.postMessage({ type: MessageType.WebsocketMessage,
          payload: {
            type: 'income',
            url: this.url,
            message: event.data
          }
        }, '*');
      });
    }

    send(data: string | BufferSource | Blob): void {
      window.postMessage({ type: MessageType.WebsocketMessage,
        payload: {
          type: 'outcome',
          url: this.url,
          message: data
        }
      }, '*');

      super.send(data);
    }
  }

  window.WebSocket = InterceptedWebSocket;
}());
