(function overrideWebSocket() {
  class InterceptedWebSocket extends WebSocket {
    private jsonParserRegex = /[^"]*"(.+)"[^"]*/;

    constructor(url: string, protocols?: string | string[]) {
      super(url, protocols);

      this.addEventListener('message', (event) => {
        try {
          const json = JSON.parse(event.data.replace(this.jsonParserRegex, '$1').replaceAll('\\', ''));
          console.log('- Incoming message intercepted:', json);
        } catch (error) { /* empty */ }
      });
    }

    send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
      try {
        if (typeof data === 'string') {
          const json = JSON.parse(data.replace(this.jsonParserRegex, '$1').replaceAll('\\', ''));
          console.log('- Outgoing message intercepted:', json);
        }
      } catch (error) { /* empty */ }
      super.send(data);
    }
  }

  window.WebSocket = InterceptedWebSocket;
}());
