import { Request, Response } from 'har-format';

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

export interface IRequest extends chrome.devtools.network.Request {
  uuid: string,
  isCors: boolean,
  isError: boolean,
  isWarning: boolean,
  request: Request,
  response: Response,
  time: number,
  requestJSON: {
    id: string,
    jsonrpc: string,
    method: string,
    params: JSONValue
  },
  rawRequest: string,
  responseJSON: {
    id: string,
    jsonrpc: string,
    error?: {
      code: number
      message: string
    }
    result?: JSONValue
  },
  rawResponse: string,
}
