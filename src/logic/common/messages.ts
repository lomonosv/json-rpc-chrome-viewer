export enum MessageType {
  WebsocketMessage = 'JSON_RPC_WEBSOCKET_MESSAGE',
  InterceptedRequest = 'JSON_RPC_INTERCEPTED_REQUEST',
  InterceptorStateRequest = 'JSON_RPC_INTERCEPTOR_STATE_REQUEST',
  InterceptorState = 'JSON_RPC_INTERCEPTOR_STATE',
  InterceptorRules = 'JSON_RPC_INTERCEPTOR_RULES',
  PendingRequest = 'JSON_RPC_PENDING_REQUEST',
  ObservedRequest = 'JSON_RPC_OBSERVED_REQUEST',
}

export const interceptorPortName = 'json-rpc-interceptor-panel';
