export enum SearchScope {
  Method = 'method',
  Request = 'request',
  Response = 'response',
  All = 'all',
}

export const searchScopeOptions: { key: SearchScope, value: string }[] = [
  { key: SearchScope.Method, value: 'Method' },
  { key: SearchScope.Request, value: 'Request' },
  { key: SearchScope.Response, value: 'Response' },
  { key: SearchScope.All, value: 'All' }
];
