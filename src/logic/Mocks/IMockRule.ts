export enum MockResponseType {
  Result = 'result',
  Error = 'error',
}

export const mockResponseTypeOptions = [
  { key: MockResponseType.Result, value: 'result' },
  { key: MockResponseType.Error, value: 'error' }
];

export interface IMockRule {
  id: string,
  enabled: boolean,
  // Exact method name, or a glob using `*` as a wildcard.
  method: string,
  // Substring matched against the request url. Empty matches any url.
  urlPattern?: string,
  responseType: MockResponseType,
  // Raw JSON text as typed by the user; kept as text so a half-written rule survives editing.
  body: string,
  status: number,
  delay: number,
}

export interface IMockedRequestPayload {
  url: string,
  method: string,
  requestBody: string,
  responseBody: string,
  status: number,
  time: number,
  headers: { name: string, value: string }[],
}
