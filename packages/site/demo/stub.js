/*
 * Runs the extension's real panel bundle (build/application.js) on a web page.
 *
 * The panel only talks to the outside world through `chrome.*`, so this file
 * stands in for that API and plays scripted traffic through the same entry
 * points DevTools uses: the INITIAL_REQUESTS_DATA backlog event, then
 * chrome.devtools.network.onRequestFinished and chrome.runtime.onMessage. What
 * renders is therefore the actual panel, not a drawing of it.
 *
 * Plain JS, not bundled - it is copied next to application.js by
 * scripts/prepare-demo.mjs.
 */
window.process = { env: {} };

// The panel focuses its filter on mount, which is right inside DevTools but,
// embedded in the site, would take the keyboard away from the page (arrows and
// Space stop scrolling it) and can scroll the page to the iframe. Programmatic
// focus is therefore ignored until the visitor has touched the panel.
(() => {
  const nativeFocus = HTMLElement.prototype.focus;
  let isEngaged = false;
  const engage = () => { isEngaged = true; };
  window.addEventListener('pointerdown', engage, { capture: true, once: true });
  window.addEventListener('keydown', engage, { capture: true, once: true });
  HTMLElement.prototype.focus = function focus(...args) {
    if (isEngaged) nativeFocus.apply(this, args);
  };
})();

(() => {
  const params = new URLSearchParams(location.search);
  const listeners = { finished: [], navigated: [], message: [] };
  const event = (list) => ({
    addListener: (fn) => list.push(fn),
    removeListener: (fn) => {
      const index = list.indexOf(fn);
      if (index >= 0) list.splice(index, 1);
    },
    hasListener: (fn) => list.includes(fn)
  });

  // Settings live in memory for the visit, seeded so the demo shows everything.
  const storage = {
    settings_includeWebsocketLogs: true,
    settings_serverGroupState: 'expanded'
  };

  const base = Date.now();
  const iso = (offset) => new Date(base + offset).toISOString();
  const rpc = (id, method, params) => JSON.stringify({ jsonrpc: '2.0', id, method, params });
  const ok = (id, result) => JSON.stringify({ jsonrpc: '2.0', id, result });
  const fail = (id, code, message) => JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } });
  const timings = (blocked, send, wait, receive, connect = -1) => ({
    blocked, dns: connect > 0 ? 12 : -1, connect, ssl: connect > 0 ? Math.round(connect * 0.6) : -1,
    send, wait, receive, _blocked_queueing: Math.round(blocked * 0.6)
  });

  const responses = {};
  const httpEntry = ({ offset, method, id, params, response, time, timing, url = 'https://api.example.com/rpc', size = 1200 }) => {
    responses[method] = response;

    return {
      startedDateTime: iso(offset),
      time,
      timings: timing,
      _resourceType: 'fetch',
      request: {
        method: 'POST',
        url,
        headers: [
          { name: 'content-type', value: 'application/json' },
          { name: 'referer', value: 'https://app.example.com/dashboard' }
        ],
        postData: { mimeType: 'application/json', text: rpc(id, method, params) }
      },
      response: {
        status: 200,
        headers: [{ name: 'content-type', value: 'application/json' }],
        content: { size, mimeType: 'application/json' },
        bodySize: size,
        _transferSize: size + 320
      },
      getContent: (callback) => callback(response, '')
    };
  };

  const gzipBase64 = async (text) => {
    const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'));
    const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
    let binary = '';
    bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
    return btoa(binary);
  };

  // The page load: its document response carries the server-side calls made
  // while rendering it, exactly as @json-rpc-chrome-viewer/server-logger sends them.
  const documentEntry = async () => {
    const log = {
      v: 1,
      calls: [
        { url: 'http://auth.internal/rpc', startTime: base - 420, time: 38, status: 200,
          rawRequest: rpc(1, 'getSession', { token: '•••' }), rawResponse: ok(1, { userId: 4182, role: 'admin' }) },
        { url: 'https://node.internal/rpc', startTime: base - 400, time: 64, status: 200,
          rawRequest: rpc(2, 'eth_blockNumber', []), rawResponse: ok(2, '0x13a5f2c') },
        { url: 'https://catalog.internal/rpc', startTime: base - 330, time: 112, status: 200,
          rawRequest: rpc(3, 'getMenu', { locale: 'en' }), rawResponse: ok(3, { items: ['Dashboard', 'Orders', 'Wallet'] }) }
      ]
    };

    return {
      startedDateTime: iso(-500),
      time: 190,
      timings: timings(2, 1, 160, 27, 30),
      _resourceType: 'document',
      request: { method: 'GET', url: 'https://app.example.com/dashboard', headers: [] },
      response: {
        status: 200,
        headers: [{ name: 'x-json-rpc-log', value: await gzipBase64(JSON.stringify(log)) }],
        content: { size: 31000, mimeType: 'text/html' }
      },
      getContent: (callback) => callback('<!doctype html>', '')
    };
  };

  const initial = [
    httpEntry({ offset: 120, method: 'getProfile', id: 7, params: { userId: 4182 }, time: 212,
      timing: timings(18, 4, 130, 30, 30),
      response: ok(7, { name: 'Ada Lovelace', plan: 'pro', teams: ['core', 'infra'], lastSeen: '2026-10-26T09:14:02Z' }) }),
    httpEntry({ offset: 150, method: 'eth_getBalance', id: 8, size: 310, time: 318,
      params: ['0x8ba1f109551bd432803012645ac136ddd64dba72', 'latest'],
      timing: timings(22, 6, 250, 40), response: ok(8, '0x1bc16d674ec80000') }),
    httpEntry({ offset: 180, method: 'listOrders', id: 9, params: { page: 1, limit: 25 }, time: 402, size: 8400,
      timing: timings(12, 4, 286, 100),
      response: ok(9, { total: 214, items: [{ id: 'ord_9f2c', amount: 42.5, status: 'paid' }, { id: 'ord_9f2b', amount: 18, status: 'refunded' }] }) })
  ];

  // Arrives while the visitor watches, so the list is seen filling up live.
  const live = [
    { at: 900, socket: { type: 'outcome', message: rpc(10, 'eth_subscribe', ['newHeads']) } },
    { at: 1100, socket: { type: 'income', message: ok(10, '0x9cef478923ff08bf') } },
    { at: 1700, http: () => httpEntry({ offset: 1300, method: 'transfer', id: 11, size: 200, time: 1240,
      params: { to: '0x71c7656ec7ab88b098defb751b7401b5f6d8976f', amount: '12.5' },
      timing: timings(30, 10, 1120, 80), response: fail(11, -32602, 'Invalid params: amount exceeds balance') }) },
    { at: 2400, http: () => httpEntry({ offset: 2300, method: 'getFeatureFlags', id: 12, size: 220, time: 96,
      url: 'https://flags.example.org/rpc', params: {}, timing: timings(4, 2, 70, 20),
      response: ok(12, { newCheckout: true, darkLaunch: false }) }) },
    ...[2900, 3700].map((at, index) => ({ at, socket: { type: 'income', message: JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_subscription',
      params: { subscription: '0x9cef478923ff08bf', result: { number: `0x${ (20602669 + index).toString(16) }`, gasUsed: '0x1c9c380' } }
    }) } }))
  ];

  const emitSocket = ({ type, message }) => listeners.message.forEach((fn) => fn(
    { type: 'JSON_RPC_WEBSOCKET_MESSAGE', payload: { type, url: 'wss://stream.example.com', message } },
    { tab: { id: 1 } }
  ));

  let resendId = 100;

  window.chrome = {
    devtools: {
      inspectedWindow: { tabId: 1, eval: (expression, callback) => callback && callback(0), reload() {} },
      network: { onRequestFinished: event(listeners.finished), onNavigated: event(listeners.navigated) },
      panels: { themeName: params.get('theme') === 'light' ? 'default' : 'dark', setThemeChangeHandler() {} }
    },
    runtime: {
      id: 'json-rpc-chrome-viewer-demo',
      onMessage: event(listeners.message),
      connect: () => ({ postMessage() {}, disconnect() {}, onDisconnect: event([]), onMessage: event([]) }),
      sendMessage() {}
    },
    storage: {
      local: {
        get: (keys, callback) => {
          const result = {};
          [].concat(keys).forEach((key) => { if (key in storage) result[key] = storage[key]; });
          callback && callback(result);
          return Promise.resolve(result);
        },
        set: (values) => {
          Object.assign(storage, values);
          return Promise.resolve();
        }
      },
      onChanged: event([])
    },
    tabs: {
      query: () => Promise.resolve([{ id: 1 }]),
      create: ({ url }) => { window.open(url, '_blank', 'noopener'); }
    },
    scripting: {
      // Resend: answer with the method's canned response, reported the way
      // DevTools would report the real call.
      executeScript: ({ args }) => {
        try {
          const [item, edited] = args || [];
          const body = JSON.parse(item.request.postData.text);
          const id = resendId++;
          const method = body.method;
          const entry = httpEntry({
            offset: Date.now() - base, method, id, time: 180, timing: timings(8, 3, 140, 29),
            url: item.request.url,
            params: { ...(body.params || {}), ...(edited && edited.payload ? { payload: edited.payload } : {}) },
            response: (responses[method] || ok(id, null)).replace(/"id":\d+/, `"id":${ id }`)
          });
          setTimeout(() => listeners.finished.forEach((fn) => fn(entry)), 180);
        } catch (error) {
          // A demo resend that cannot be simulated simply does nothing.
        }
        return Promise.resolve([]);
      }
    }
  };

  window.addEventListener('load', async () => {
    const backlog = [await documentEntry(), ...initial];

    window.dispatchEvent(new CustomEvent('INITIAL_REQUESTS_DATA', {
      detail: backlog.map((request) => ({ request, responseContent: '' }))
    }));

    live.forEach(({ at, socket, http }) => setTimeout(() => {
      if (socket) emitSocket(socket);
      if (http) {
        const entry = http();
        listeners.finished.forEach((fn) => fn(entry));
      }
    }, at));
  });
})();
