export type RowKind = 'http' | 'socket' | 'server' | 'mock';

export interface IPhases {
  idle: number,
  send: number,
  wait: number,
  download: number,
}

export interface IMockRow {
  id: string,
  kind: RowKind,
  method: string,
  url: string,
  status: number | string,
  size: string,
  // Offset and duration in ms on one shared timeline.
  start: number,
  time: number,
  phases?: IPhases,
  error?: { code: number, message: string },
  request: unknown,
  response: unknown,
}

export const timelineMs = 1900;

export const serverGroup = { carrier: 'GET /dashboard', id: 'dashboard' };

export const mockRows: IMockRow[] = [
  {
    id: 's1',
    kind: 'server',
    method: 'getSession',
    url: 'http://auth.internal/rpc',
    status: 200,
    size: '0.4 kB',
    start: 0,
    time: 38,
    request: { jsonrpc: '2.0', id: 1, method: 'getSession', params: { token: '•••' } },
    response: { jsonrpc: '2.0', id: 1, result: { userId: 4182, role: 'admin' } }
  },
  {
    id: 's2',
    kind: 'server',
    method: 'eth_blockNumber',
    url: 'https://node.internal/rpc',
    status: 200,
    size: '0.1 kB',
    start: 20,
    time: 64,
    request: { jsonrpc: '2.0', id: 2, method: 'eth_blockNumber', params: [] },
    response: { jsonrpc: '2.0', id: 2, result: '0x13a5f2c' }
  },
  {
    id: 'h1',
    kind: 'http',
    method: 'getProfile',
    url: 'https://api.example.com/rpc',
    status: 200,
    size: '1.2 kB',
    start: 140,
    time: 212,
    phases: { idle: 18, send: 4, wait: 160, download: 30 },
    request: { jsonrpc: '2.0', id: 7, method: 'getProfile', params: { userId: 4182 } },
    response: {
      jsonrpc: '2.0',
      id: 7,
      result: { name: 'Ada Lovelace', plan: 'pro', teams: ['core', 'infra'], lastSeen: '2026-10-26T09:14:02Z' }
    }
  },
  {
    id: 'h2',
    kind: 'http',
    method: 'eth_getBalance',
    url: 'https://api.example.com/rpc',
    status: 200,
    size: '0.3 kB',
    start: 160,
    time: 318,
    phases: { idle: 22, send: 6, wait: 250, download: 40 },
    request: { jsonrpc: '2.0', id: 8, method: 'eth_getBalance', params: ['0x8ba1…ba72', 'latest'] },
    response: { jsonrpc: '2.0', id: 8, result: '0x1bc16d674ec80000' }
  },
  {
    id: 'w1',
    kind: 'socket',
    method: 'subscribe',
    url: 'wss://stream.example.com',
    status: '↑',
    size: '0.1 kB',
    start: 420,
    time: 0,
    request: { jsonrpc: '2.0', id: 9, method: 'subscribe', params: ['newHeads'] },
    response: { jsonrpc: '2.0', id: 9, result: '0x9cef478923ff08bf' }
  },
  {
    id: 'm1',
    kind: 'mock',
    method: 'getFeatureFlags',
    url: 'https://api.example.com/rpc',
    status: 200,
    size: '0.2 kB',
    start: 520,
    time: 800,
    request: { jsonrpc: '2.0', id: 10, method: 'getFeatureFlags', params: {} },
    response: { jsonrpc: '2.0', id: 10, result: { newCheckout: true, darkLaunch: false } }
  },
  {
    id: 'h3',
    kind: 'http',
    method: 'transfer',
    url: 'https://api.example.com/rpc',
    status: 200,
    size: '0.2 kB',
    start: 610,
    time: 1240,
    phases: { idle: 30, send: 10, wait: 1120, download: 80 },
    error: { code: -32602, message: 'Invalid params: amount exceeds balance' },
    request: { jsonrpc: '2.0', id: 11, method: 'transfer', params: { to: '0x71c7…976f', amount: '12.5' } },
    response: { jsonrpc: '2.0', id: 11, error: { code: -32602, message: 'Invalid params: amount exceeds balance' } }
  },
  {
    id: 'w2',
    kind: 'socket',
    method: 'eth_subscription',
    url: 'wss://stream.example.com',
    status: '↓',
    size: '0.6 kB',
    start: 900,
    time: 0,
    request: {
      jsonrpc: '2.0',
      method: 'eth_subscription',
      params: { subscription: '0x9cef478923ff08bf', result: { number: '0x13a5f2d', gasUsed: '0x1c9c380' } }
    },
    response: null
  },
  {
    id: 'h4',
    kind: 'http',
    method: 'listOrders',
    url: 'https://api.example.com/rpc',
    status: 200,
    size: '8.4 kB',
    start: 980,
    time: 402,
    phases: { idle: 12, send: 4, wait: 286, download: 100 },
    request: { jsonrpc: '2.0', id: 12, method: 'listOrders', params: { page: 1, limit: 25 } },
    response: { jsonrpc: '2.0', id: 12, result: { total: 214, items: ['…25 orders'] } }
  }
];
