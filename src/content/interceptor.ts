import { MessageType } from '~/logic/common/messages';
import { IRequestTimings } from '~/logic/HTTPArchive/IRequest';
import {
  IInterceptedRequestPayload,
  IInterceptorRule,
  IJsonRpcItem,
  IObservedRequestPayload,
  IPendingRequestPayload
} from '~/logic/Interceptor/IInterceptorRule';
import { findRule, getRuleResponse, getRuleStatus } from '~/logic/Interceptor/rules';

(function overrideFetch() {
  const originalFetch = window.fetch;
  const nativeFetch = originalFetch.bind(window);
  const jsonRPCRegex = /jsonrpc\\?["']?\s*:\s*\\?["']?2\.0\\?["']?/;

  let rules: IInterceptorRule[] = [];
  let isEnabled = false;
  let isResilientCapture = false;

  const isArmed = (): boolean => isEnabled && !!rules.length;
  const shouldPatch = (): boolean => isArmed() || isResilientCapture;

  const parse = (text: string) => {
    try {
      return JSON.parse(text);
    } catch (e) {
      return null;
    }
  };

  const getAbortError = (signal: AbortSignal): unknown => (
    signal.reason ?? new DOMException('The user aborted a request.', 'AbortError')
  );

  const throwIfAborted = (signal: AbortSignal) => {
    if (signal?.aborted) {
      throw getAbortError(signal);
    }
  };

  const sleep = (ms: number, signal: AbortSignal) => new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);

    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(getAbortError(signal));
    }, { once: true });
  });

  const getUrl = (input: RequestInfo | URL): string => {
    const rawUrl = input instanceof Request ? input.url : String(input);

    try {
      return new URL(rawUrl, window.location.href).href;
    } catch (e) {
      return rawUrl;
    }
  };

  const getMethod = (input: RequestInfo | URL, init: RequestInit): string => (
    init?.method || (input instanceof Request ? input.method : 'POST')
  );

  const getBody = async (input: RequestInfo | URL, init: RequestInit): Promise<string> => {
    if (typeof init?.body === 'string') {
      return init.body;
    }

    return input instanceof Request ? input.clone().text().catch(() => null) : null;
  };

  const getHeaders = (input: RequestInfo | URL, init: RequestInit): { name: string, value: string }[] => {
    const source = init?.headers || (input instanceof Request ? input.headers : null);
    const headers: { name: string, value: string }[] = [];

    try {
      if (source) {
        new Headers(source).forEach((value, name) => {
          headers.push({ name, value });
        });
      }
    } catch (e) {
      return [];
    }

    return headers;
  };

  const sendItems = async (
    input: RequestInfo | URL,
    init: RequestInit,
    items: IJsonRpcItem[]
  ): Promise<IJsonRpcItem[]> => {
    if (!items.length) {
      return [];
    }

    const body = JSON.stringify(items);

    try {
      const response = await (input instanceof Request
        ? nativeFetch(new Request(input, { body }))
        : nativeFetch(input, { ...init, body }));
      const json = parse(await response.text());

      return Array.isArray(json) ? json : [json].filter(Boolean);
    } catch (e) {
      return [];
    }
  };

  const report = (payload: IInterceptedRequestPayload) => {
    window.postMessage({ type: MessageType.InterceptedRequest, payload }, '*');
  };

  interface IInterceptionPlan {
    url: string,
    isBatch: boolean,
    items: IJsonRpcItem[],
    intercepted: { item: IJsonRpcItem, rule: IInterceptorRule }[],
    passthroughItems: IJsonRpcItem[],
  }

  const planInterception = async (
    input: RequestInfo | URL,
    init: RequestInit
  ): Promise<IInterceptionPlan> => {
    try {
      const rawRequest = await getBody(input, init);

      if (!rawRequest || !jsonRPCRegex.test(rawRequest)) {
        return null;
      }

      const requestJSON = parse(rawRequest);

      if (!requestJSON) {
        return null;
      }

      const url = getUrl(input);
      const isBatch = Array.isArray(requestJSON);
      const items: IJsonRpcItem[] = isBatch ? requestJSON : [requestJSON];
      const resolutions = items.map((item) => ({
        item,
        rule: item?.id === undefined || item?.id === null ? null : findRule(rules, item.method, url)
      }));
      const intercepted = resolutions.filter(({ rule }) => rule);

      if (!intercepted.length) {
        return null;
      }

      return {
        url,
        isBatch,
        items,
        intercepted,
        passthroughItems: resolutions.filter(({ rule }) => !rule).map(({ item }) => item)
      };
    } catch (e) {
      return null;
    }
  };

  interface IPendingObservationPlan {
    url: string,
    isBatch: boolean,
    items: IJsonRpcItem[],
  }

  const planObservation = async (
    input: RequestInfo | URL,
    init: RequestInit
  ): Promise<IPendingObservationPlan> => {
    try {
      const rawRequest = await getBody(input, init);

      if (!rawRequest || !jsonRPCRegex.test(rawRequest)) {
        return null;
      }

      const requestJSON = parse(rawRequest);

      if (!requestJSON) {
        return null;
      }

      const isBatch = Array.isArray(requestJSON);

      return {
        url: getUrl(input),
        isBatch,
        items: isBatch ? requestJSON : [requestJSON]
      };
    } catch (e) {
      return null;
    }
  };

  const reportPending = (payload: IPendingRequestPayload) => {
    window.postMessage({ type: MessageType.PendingRequest, payload }, '*');
  };

  const reportObserved = (payload: IObservedRequestPayload) => {
    window.postMessage({ type: MessageType.ObservedRequest, payload }, '*');
  };

  let callCounter = 0;

  const getResourceTimings = (url: string, startTime: number): IRequestTimings => {
    try {
      const entries = performance.getEntriesByName(url, 'resource') as PerformanceResourceTiming[];

      if (!entries.length) {
        return null;
      }

      const toEpoch = (entry: PerformanceResourceTiming) => performance.timeOrigin + entry.startTime;
      const entry = entries.reduce((closest, candidate) => (
        Math.abs(toEpoch(candidate) - startTime) < Math.abs(toEpoch(closest) - startTime) ? candidate : closest
      ));

      if (!entry.responseEnd || !entry.requestStart) {
        return null;
      }

      const applicable = (value: number) => (value > 0 ? value : -1);

      return {
        blocked: Math.max(entry.domainLookupStart - entry.startTime, 0),
        queueing: -1,
        dns: applicable(entry.domainLookupEnd - entry.domainLookupStart),
        connect: applicable(entry.connectEnd - entry.connectStart),
        ssl: entry.secureConnectionStart
          ? applicable(entry.connectEnd - entry.secureConnectionStart)
          : -1,
        // Resource Timing does not separate time spent sending; it is folded into the wait below.
        send: -1,
        wait: Math.max(entry.responseStart - entry.requestStart, 0),
        receive: Math.max(entry.responseEnd - entry.responseStart, 0)
      };
    } catch (e) {
      return null;
    }
  };

  const observeFetch = async (input: RequestInfo | URL, init: RequestInit): Promise<Response> => {
    const plan = await planObservation(input, init);
    const trackedItems = plan
      ? plan.items.filter((item) => item?.id !== undefined && item?.id !== null)
      : [];

    if (!trackedItems.length) {
      return nativeFetch(input, init);
    }

    const startTime = Date.now();

    callCounter += 1;

    const callId = `${ startTime }-${ callCounter }`;

    trackedItems.forEach((item) => {
      reportPending({
        url: plan.url,
        method: item.method,
        id: item.id,
        params: item.params,
        startTime,
        callId
      });
    });

    const rawRequest = JSON.stringify(plan.isBatch ? trackedItems : trackedItems[0]);

    try {
      const response = await nativeFetch(input, init);

      response.clone().text().then((rawResponse) => {
        reportObserved({
          url: plan.url,
          method: getMethod(input, init),
          headers: getHeaders(input, init),
          status: response.status,
          startTime,
          time: Date.now() - startTime,
          rawRequest,
          rawResponse,
          callId,
          timings: getResourceTimings(plan.url, startTime)
        });
      }).catch(() => {
        reportObserved({
          url: plan.url,
          method: getMethod(input, init),
          headers: getHeaders(input, init),
          status: response.status,
          startTime,
          time: Date.now() - startTime,
          rawRequest,
          rawResponse: '',
          callId,
          timings: getResourceTimings(plan.url, startTime)
        });
      });

      return response;
    } catch (e) {
      reportObserved({
        url: plan.url,
        method: getMethod(input, init),
        headers: getHeaders(input, init),
        status: 0,
        startTime,
        time: Date.now() - startTime,
        rawRequest,
        rawResponse: JSON.stringify({ error: { message: String(e) } }),
        callId
      });

      throw e;
    }
  };

  const interceptFetch = async (input: RequestInfo | URL, init: RequestInit): Promise<Response> => {
    if (!isArmed()) {
      return isResilientCapture ? observeFetch(input, init) : nativeFetch(input, init);
    }

    const plan = await planInterception(input, init);

    if (!plan) {
      return nativeFetch(input, init);
    }

    const { url, isBatch, items, intercepted, passthroughItems } = plan;
    const signal = init?.signal ?? (input instanceof Request ? input.signal : null);

    throwIfAborted(signal);

    const startTime = Date.now();
    const passthroughResponses = await sendItems(input, init, passthroughItems);
    const interceptedResponses = intercepted.map(({ item, rule }) => getRuleResponse(rule, item.id));
    const delay = Math.max(0, ...intercepted.map(({ rule }) => rule.delay || 0));

    if (delay) {
      await sleep(delay, signal);
    }

    throwIfAborted(signal);

    const responsesById = new Map(
      [...passthroughResponses, ...interceptedResponses].map(
        (item): [unknown, IJsonRpcItem] => [item?.id, item]
      )
    );

    const responses = items.map((item) => responsesById.get(item?.id)).filter(Boolean);
    const status = getRuleStatus(intercepted[0].rule);

    report({
      url,
      method: getMethod(input, init),
      headers: getHeaders(input, init),
      status,
      startTime,
      time: Date.now() - startTime,
      rawRequest: JSON.stringify(isBatch ? intercepted.map(({ item }) => item) : intercepted[0].item),
      rawResponse: JSON.stringify(isBatch ? interceptedResponses : interceptedResponses[0])
    });

    return new Response(JSON.stringify(isBatch ? responses : responses[0]), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });
  };

  const patchedFetch = function fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    if (!shouldPatch()) {
      return nativeFetch(input, init);
    }

    return interceptFetch(input, init);
  };

  const applyPatch = () => {
    window.fetch = shouldPatch() ? patchedFetch : originalFetch;
  };

  window.addEventListener('message', (event) => {
    if (event.source !== window || event.data?.type !== MessageType.InterceptorRules) {
      return;
    }

    rules = event.data.payload?.rules || [];
    isEnabled = !!event.data.payload?.isEnabled;
    isResilientCapture = !!event.data.payload?.isResilientCapture;

    applyPatch();
  });
}());
