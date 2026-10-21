import { IRequest, JSONValue } from './IRequest';

export enum Slowness {
  Normal = 'normal',
  Slow = 'slow',
  VerySlow = 'verySlow',
}

const slowCallMs = 1000;
const verySlowCallMs = 3000;

export const getSlowness = (request: IRequest): Slowness => {
  if (request.isWebSocket || request.isPending) {
    return Slowness.Normal;
  }

  if (request.time >= verySlowCallMs) {
    return Slowness.VerySlow;
  }

  return request.time >= slowCallMs ? Slowness.Slow : Slowness.Normal;
};

export interface IRequestError {
  code: string,
  message: string,
}

export const getRequestError = (request: IRequest): IRequestError => {
  const error: JSONValue = request.isWebSocket
    ? request.websocketJSON?.error
    : request.responseJSON?.error;

  if (error === undefined || error === null) {
    return null;
  }

  if (typeof error !== 'object' || Array.isArray(error)) {
    return { code: '', message: JSON.stringify(error) };
  }

  const { code, message } = error;
  const isPrintable = (value: JSONValue) => typeof value === 'number' || (typeof value === 'string' && value !== '');

  return {
    code: isPrintable(code) ? String(code) : '',
    message: isPrintable(message) ? String(message) : JSON.stringify(error)
  };
};

export const getErrorSummary = (request: IRequest): string => {
  const error = getRequestError(request);

  return error ? [error.code, error.message].filter(Boolean).join(' ') : '';
};

export const formatSize = (bytes: number): string => {
  if (bytes < 1000) {
    return `${ Math.round(bytes) } B`;
  }

  if (bytes < 1000 * 1000) {
    return `${ (bytes / 1000).toFixed(1) } kB`;
  }

  return `${ (bytes / (1000 * 1000)).toFixed(1) } MB`;
};

export const formatDuration = (ms: number): string => {
  if (ms < 1000) {
    return `${ Math.round(ms) } ms`;
  }

  if (ms < 60 * 1000) {
    return `${ (ms / 1000).toFixed(1) } s`;
  }

  return `${ Math.floor(ms / 60000) } min ${ Math.round((ms % 60000) / 1000) } s`;
};

export interface IListSummary {
  count: number,
  errors: number,
  slow: number,
  size: number,
}

export const getListSummary = (requests: IRequest[]): IListSummary => requests.reduce((acc, request) => ({
  count: acc.count + 1,
  // Not `isError`: websocket frames never set it, but an error frame is one.
  errors: acc.errors + (getRequestError(request) ? 1 : 0),
  slow: acc.slow + (getSlowness(request) === Slowness.Normal ? 0 : 1),
  size: acc.size + (request.isWebSocket || request.isPending ? 0 : request.response?.content?.size || 0)
}), {
  count: 0,
  errors: 0,
  slow: 0,
  size: 0
});
