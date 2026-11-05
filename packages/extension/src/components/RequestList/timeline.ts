import { IRequest } from '~/logic/HTTPArchive/IRequest';

export interface ITimeline {
  start: number,
  span: number,
}

export const getRequestEnd = (request: IRequest, now: number) => {
  if (request.isPending) {
    return Math.max(now, request.startTime);
  }

  return request.startTime + (request.isWebSocket ? 0 : request.time);
};

/**
 * One timeline for the whole list, like Chrome's Network waterfall: from the
 * first start to the last end, where an in-flight call ends `now`.
 */
export const getTimeline = (requests: IRequest[], now: number): ITimeline => {
  if (!requests.length) {
    return { start: 0, span: 1 };
  }

  const start = Math.min(...requests.map((request) => request.startTime));
  const end = Math.max(...requests.map((request) => getRequestEnd(request, now)));

  return { start, span: Math.max(end - start, 1) };
};
