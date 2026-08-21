import { IMockRule } from '~/logic/Mocks/IMockRule';
import { matchRule, buildMockBody } from '~/logic/Mocks/matchRule';

// Runs in the MAIN world at document_start, so it can replace the page's own `fetch`.
// Rules arrive from content.ts (ISOLATED world) over window.postMessage, because
// chrome.storage is not reachable from here.
(function overrideFetch() {
  const nativeFetch = window.fetch.bind(window);
  const jsonRpcRegex = /jsonrpc\\?["']?\s*:\s*\\?["']?2\.0\\?["']?/;
  // Safety net: never hang the page's requests if the rules never arrive.
  const rulesReadyTimeoutMs = 1000;

  interface IJsonRpcItem {
    id?: string | number,
    method?: string,
  }

  let rules: IMockRule[] = [];
  let enabled = false;
  let resolveReady: () => void;

  const ready = new Promise<void>((resolve) => {
    resolveReady = resolve;
  });
  const readyTimer = setTimeout(() => resolveReady(), rulesReadyTimeoutMs);

  window.addEventListener('message', (event) => {
    if (event.source !== window || event.data?.type !== 'JSON_RPC_MOCK_RULES') {
      return;
    }

    rules = event.data.payload?.rules || [];
    enabled = !!event.data.payload?.enabled;

    clearTimeout(readyTimer);
    resolveReady();
  });

  const sleep = (ms: number) => new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

  const getUrl = (input: RequestInfo | URL): string => (
    input instanceof Request ? input.url : String(input)
  );

  const getRequestBody = async (input: RequestInfo | URL, init?: RequestInit): Promise<string> => {
    if (typeof init?.body === 'string') {
      return init.body;
    }

    if (input instanceof Request) {
      return input.clone().text().catch(() => null);
    }

    return null;
  };

  const getHeaders = (input: RequestInfo | URL, init?: RequestInit): { name: string, value: string }[] => {
    const source = init?.headers || (input instanceof Request ? input.headers : undefined);

    if (!source) {
      return [];
    }

    const headers: { name: string, value: string }[] = [];

    new Headers(source).forEach((value, name) => {
      headers.push({ name, value });
    });

    return headers;
  };

  const parse = (text: string) => {
    try {
      return JSON.parse(text);
    } catch (e) {
      return null;
    }
  };

  const withReducedBody = (
    input: RequestInfo | URL,
    init: RequestInit,
    body: string
  ): Promise<Response> => (
    input instanceof Request
      ? nativeFetch(new Request(input, { body }))
      : nativeFetch(input, { ...init, body })
  );

  const fetchPassthrough = async (
    input: RequestInfo | URL,
    init: RequestInit,
    items: IJsonRpcItem[]
  ): Promise<IJsonRpcItem[]> => {
    if (!items.length) {
      return [];
    }

    try {
      const response = await withReducedBody(input, init, JSON.stringify(items));
      const json = parse(await response.text());

      return Array.isArray(json) ? json : [];
    } catch (e) {
      return [];
    }
  };

  const report = (payload: object) => {
    window.postMessage({ type: 'JSON_RPC_MOCKED_REQUEST', payload }, '*');
  };

  window.fetch = async function fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    // `fetch` is async, so awaiting the first rule delivery here closes the document_start
    // race without ever making the patch synchronous.
    await ready;

    if (!enabled || !rules.length) {
      return nativeFetch(input, init);
    }

    const rawRequest = await getRequestBody(input, init);

    if (!rawRequest || !jsonRpcRegex.test(rawRequest)) {
      return nativeFetch(input, init);
    }

    const requestJSON = parse(rawRequest);

    if (!requestJSON) {
      return nativeFetch(input, init);
    }

    const url = getUrl(input);
    const isBatch = Array.isArray(requestJSON);
    const items: IJsonRpcItem[] = isBatch ? requestJSON : [requestJSON];

    // Notifications carry no id, so there is no response to mock — let them through.
    const matches = items.map((item) => (
      item?.id === undefined || item?.id === null ? null : matchRule(rules, item.method, url)
    ));

    if (!matches.some(Boolean)) {
      return nativeFetch(input, init);
    }

    const startedAt = Date.now();
    const mocked = items
      .map((item, index) => ({ item, rule: matches[index] }))
      .filter(({ rule }) => !!rule);
    const passthroughItems = items.filter((item, index) => !matches[index]);

    const passthroughResponses = await fetchPassthrough(input, init, passthroughItems);
    const mockedItems = mocked.map(({ item }) => item);
    const mockedResponses = mocked.map(({ item, rule }) => buildMockBody(rule, item.id));

    const firstRule = mocked[0].rule;
    const delay = Math.max(0, ...mocked.map(({ rule }) => rule.delay || 0));

    if (delay) {
      await sleep(delay);
    }

    const responsesById = [...passthroughResponses, ...mockedResponses as IJsonRpcItem[]].reduce(
      (acc, item) => ({ ...acc, [item?.id]: item }),
      {}
    );
    const merged = items.map((item) => responsesById[item.id]).filter(Boolean);

    const rawResponse = JSON.stringify(isBatch ? merged : merged[0]);
    const status = firstRule.status || 200;

    // Only the mocked half is reported — the passthrough half reaches the panel through
    // chrome.devtools.network as a real request, and would otherwise be listed twice.
    report({
      url,
      method: input instanceof Request ? input.method : (init?.method || 'POST'),
      headers: getHeaders(input, init),
      status,
      time: Date.now() - startedAt,
      requestBody: JSON.stringify(isBatch ? mockedItems : mockedItems[0]),
      responseBody: JSON.stringify(isBatch ? mockedResponses : mockedResponses[0])
    });

    return new Response(rawResponse, {
      status,
      headers: { 'Content-Type': 'application/json' }
    });
  };
}());
