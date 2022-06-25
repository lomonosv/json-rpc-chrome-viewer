type JSONValue =
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
  requestJSON: JSONValue,
  responseJSON: JSONValue
}
