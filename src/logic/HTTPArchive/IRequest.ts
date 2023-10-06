import { Request, Response } from 'har-format';

export type JSONValue =
  string |
  number |
  boolean |
  IJSONObject |
  IJSONArray;

interface IJSONObject {
  [k: string]: JSONValue
}

interface IJSONArray extends Array<JSONValue> { }

export interface IRequest extends chrome.devtools.network.Request {
  uuid: string,
  isCors: boolean,
  request: Request,
  response: Response,
  time: number,
  requestJSON: {
    id: string,
    jsonrpc: string,
    method: string,
    params: JSONValue
  },
  responseJSON: {
    id: string,
    jsonrpc: string,
    error?: {
      code: number
      message: string
    }
    result?: JSONValue
  }
}
