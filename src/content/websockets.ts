(function overrideWebSocket() {
  class InterceptedWebSocket extends WebSocket {
    constructor(url: string, protocols?: string | string[]) {
      super(url, protocols);

      this.addEventListener('message', (event) => {
        window.postMessage({ type: 'JSON_RPC_WEBSOCKET_MESSAGE',
          payload: {
            type: 'income',
            url: this.url,
            message: event.data
          }
        }, '*');
      });
    }

    send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
      window.postMessage({ type: 'JSON_RPC_WEBSOCKET_MESSAGE',
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
