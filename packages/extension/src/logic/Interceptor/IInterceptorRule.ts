import { IRequestTimings } from '~/logic/HTTPArchive/IRequest';

export interface IJsonRpcItem {
  id?: string | number,
  jsonrpc?: string,
  method?: string,
  params?: unknown,
  result?: unknown,
  error?: unknown,
}

export enum InterceptorResponseType {
  Result = 'result',
  Error = 'error',
}

export const interceptorResponseTypeOptions = [
  { key: InterceptorResponseType.Result, value: 'result' },
  { key: InterceptorResponseType.Error, value: 'error' }
];

export interface IInterceptorRule {
  id: string,
  isEnabled: boolean,
  method: string,
  url: string,
  responseType: InterceptorResponseType,
  body: string,
  status: number,
  delay: number,
}

export interface IInterceptedRequestPayload {
  url: string,
  method: string,
  headers: { name: string, value: string }[],
  status: number,
  startTime: number,
  time: number,
  rawRequest: string,
  rawResponse: string,
}

export interface IPendingRequestPayload {
  url: string,
  method: string,
  id: string | number,
  params?: unknown,
  startTime: number,
  callId: string,
}

export interface IObservedRequestPayload extends IInterceptedRequestPayload {
  callId: string,
  timings?: IRequestTimings,
}
