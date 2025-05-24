export type JSONValue =
  string |
  number |
  boolean |
  IJSONObject |
  IJSONArray;

export interface IJSONObject {
  [k: string]: JSONValue
}

interface IJSONArray extends Array<JSONValue> { }

export interface IRequest {
  uuid: string,
  isCors: boolean,
  isError: boolean,
  isWarning: boolean,
  isWebSocket: boolean,
  websocketMessageType?: 'income' | 'outcome',
  websocketJSON?: JSONValue & {
    id: string
    method: string,
    params?: JSONValue,
    error?: JSONValue & {
      code?: number,
      message?: string,
    }
    result?: JSONValue
  },
  request: {
    url: string,
    method?: string,
    headers?: { name: string }[],
    postData?: {
      text: string
    }
  },
  response: {
    status: number,
    content: {
      size: number,
    }
  },
  time: number,
  requestJSON?: {
    id: string,
    jsonrpc: string,
    method: string,
    params: JSONValue
  },
  rawRequest: string,
  responseJSON?: {
    id: string,
    jsonrpc: string,
    error?: JSONValue
    result?: JSONValue
  },
  rawResponse: string,
}
