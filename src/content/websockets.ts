(function overrideWebSocket() {
  class InterceptedWebSocket extends WebSocket {
    private jsonParserRegex = /[^"]*"(.+)"[^"]*/;

    constructor(url: string, protocols?: string | string[]) {
      super(url, protocols);

      this.addEventListener('message', (event) => {
        try {
          console.log('- Incoming message intercepted:', event.data.replace(this.jsonParserRegex, '$1'));
        } catch (error) { /* empty */ }
      });
    }

    send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
      try {
        if (data instanceof String) {
          console.log('- Outgoing message intercepted:', data.replace(this.jsonParserRegex, '$1'));
        }
      } catch (error) { /* empty */ }
      super.send(data);
    }
  }

  window.WebSocket = InterceptedWebSocket;
}());
