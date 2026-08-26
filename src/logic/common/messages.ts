export enum MessageType {
  WebsocketMessage = 'JSON_RPC_WEBSOCKET_MESSAGE',
  InterceptedRequest = 'JSON_RPC_INTERCEPTED_REQUEST',
  InterceptorStateRequest = 'JSON_RPC_INTERCEPTOR_STATE_REQUEST',
  InterceptorState = 'JSON_RPC_INTERCEPTOR_STATE',
  InterceptorRules = 'JSON_RPC_INTERCEPTOR_RULES',
}

export const interceptorPortName = 'json-rpc-interceptor-panel';
