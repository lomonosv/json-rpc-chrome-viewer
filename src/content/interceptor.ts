import { MessageType } from '~/logic/common/messages';
import {
  IInterceptedRequestPayload,
  IInterceptorRule,
  IJsonRpcItem
} from '~/logic/Interceptor/IInterceptorRule';
import { findRule, getRuleResponse, getRuleStatus } from '~/logic/Interceptor/rules';

(function overrideFetch() {
  const nativeFetch = window.fetch.bind(window);
  const jsonRPCRegex = /jsonrpc\\?["']?\s*:\s*\\?["']?2\.0\\?["']?/;

  const rulesTimeoutMs = 1000;

  let rules: IInterceptorRule[] = [];
  let isEnabled = false;
  let isReady = false;
  let resolveReady: () => void;

  const ready = new Promise<void>((resolve) => {
    resolveReady = () => {
      isReady = true;
      resolve();
    };
  });
  const readyTimer = setTimeout(resolveReady, rulesTimeoutMs);

  window.addEventListener('message', (event) => {
    if (event.source !== window || event.data?.type !== MessageType.InterceptorRules) {
      return;
    }

    rules = event.data.payload?.rules || [];
    isEnabled = !!event.data.payload?.isEnabled;

    clearTimeout(readyTimer);
    resolveReady();
  });

  const isArmed = (): boolean => isEnabled && !!rules.length;

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

  const getUrl = (input: RequestInfo | URL): string => (
    input instanceof Request ? input.url : String(input)
  );

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

  const interceptFetch = async (input: RequestInfo | URL, init: RequestInit): Promise<Response> => {
    await ready;

    if (!isArmed()) {
      return nativeFetch(input, init);
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

  window.fetch = function fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    if (isReady && !isArmed()) {
      return nativeFetch(input, init);
    }

    return interceptFetch(input, init);
  };
}());
