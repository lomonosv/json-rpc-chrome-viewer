import { v4 as uuid } from 'uuid';
import { IRequest, JSONValue } from '~/logic/HTTPArchive/IRequest';
import { SearchScope } from '~/logic/HTTPArchive/SearchScope';

const jsonRPCRegex = /jsonrpc\\?["']?\s*:\s*\\?["']?2\.0\\?["']?/;

export const isJsonRpcRequest = (request: chrome.devtools.network.Request) => (
  request.request &&
  request.request.postData &&
  request.request.postData.mimeType &&
  request.request.postData.mimeType.match(/application\/json/) &&
  request.request.postData.text && request.request.postData.text.match(jsonRPCRegex)
);

export const isJsonRpcMessage = (message: string) => (
  message.match(jsonRPCRegex)
);

const parse = (message: string) => {
  try {
    return JSON.parse(message);
  } catch (e) {
    return null;
  }
};

export const parseJsonRpcMessage = (message: string) => {
  const sockJSJsonParserRegex = /[^"]*"(.+)"[^"]*/;
  const json = parse(message);

  if (!json || message.startsWith('[')) {
    // SockJS message format
    return parse(message.replace(sockJSJsonParserRegex, '$1').replaceAll('\\', ''));
  }

  return json;
};

export const getRequestLabel = (request: IRequest): string => String(
  (
    request.isWebSocket
      ? request.websocketJSON.method ||
        request.websocketJSON.id ||
        request.websocketJSON.error?.message ||
        `${ request.websocketMessageType } message`
      : request.requestJSON?.method
  ) ?? ''
);

const includes = (text: string, filter: string, isCaseSensitive: boolean): boolean => (
  isCaseSensitive
    ? text.includes(filter)
    : text.toLowerCase().includes(filter.toLowerCase())
);

const stringify = (value: JSONValue): string => {
  if (value === undefined || value === null) {
    return '';
  }

  try {
    return typeof value === 'string' ? value : JSON.stringify(value);
  } catch (e) {
    return '';
  }
};

const searchTextCache = new WeakMap<IRequest, { request: string, response: string }>();

const getSearchText = (request: IRequest): { request: string, response: string } => {
  const cached = searchTextCache.get(request);

  if (cached) {
    return cached;
  }

  const requestJSON = request.isWebSocket ? request.websocketJSON : request.requestJSON;
  const responseJSON = request.isWebSocket ? request.websocketJSON : request.responseJSON;

  const text = {
    request: [requestJSON?.method, stringify(requestJSON?.params as JSONValue)]
      .filter(Boolean)
      .join(' '),
    response: responseJSON
      ? [stringify(responseJSON.result), stringify(responseJSON.error)].filter(Boolean).join(' ')
      : request.rawResponse
  };

  searchTextCache.set(request, text);

  return text;
};

const matchesLabel = (request: IRequest, filter: string, isCaseSensitive: boolean): boolean => {
  const label = request.isWebSocket
    ? request.websocketJSON.method ||
      request.websocketJSON.id ||
      request.websocketJSON.error?.message ||
      `${ request.websocketMessageType } message`
    : request.requestJSON?.method;

  return isCaseSensitive
    ? !!label?.includes?.(filter)
    : !!label?.toLowerCase?.().includes(filter.toLowerCase());
};

export const matchesFilter = (
  request: IRequest,
  filter: string,
  scope: SearchScope,
  isCaseSensitive: boolean
): boolean => {
  if (scope === SearchScope.Method) {
    return matchesLabel(request, filter, isCaseSensitive);
  }

  const searchText = getSearchText(request);

  if (scope === SearchScope.Request) {
    return includes(searchText.request, filter, isCaseSensitive);
  }

  if (scope === SearchScope.Response) {
    return includes(searchText.response, filter, isCaseSensitive);
  }

  return matchesLabel(request, filter, isCaseSensitive) ||
    includes(searchText.request, filter, isCaseSensitive) ||
    includes(searchText.response, filter, isCaseSensitive);
};

export const getPreparedMessage = (
  type: 'income' | 'outcome',
  url: string,
  json: JSONValue & { method: string, id: string }
): IRequest => ({
  uuid: uuid(),
  startTime: Date.now(),
  isCors: false,
  isError: false,
  isWarning: false,
  isWebSocket: true,
  websocketMessageType: type,
  websocketJSON: json,
  request: {
    url
  },
  response: {
    status: 200,
    content: {
      size: 0
    }
  },
  time: 0,
  rawRequest: '',
  rawResponse: ''
});

export const getPreparedHttpRequest = async (
  request: chrome.devtools.network.Request,
  responseContent?: string
): Promise<IRequest[]> => new Promise((resolve) => {
  const requests: IRequest[] = [];

  request.getContent((body) => {
    const rawRequest = request.request.postData.text;
    const rawResponse = responseContent || body;
    const requestJSON = JSON.parse(rawRequest);
    let responseJSON;

    try {
      responseJSON = JSON.parse(rawResponse);
    } catch (e) {
      responseJSON = null;
    }

    const isBatch = Array.isArray(requestJSON) && Array.isArray(responseJSON);

    const referer = request.request.headers.find(({ name }) => name.toLowerCase() === 'referer');
    const host = referer ? referer.value.replace(/(.+:\/\/)([^/]+)(\/?.*)/, '$2') : '';

    const isCors = !request.request.url.includes(host);

    const startedAt = Date.parse(request.startedDateTime);
    const startTime = Number.isNaN(startedAt) ? Date.now() : startedAt;

    if (!isBatch) {
      requests.push({
        uuid: uuid(),
        startTime,
        request: {
          url: request.request.url,
          method: request.request.method,
          headers: request.request.headers,
          postData: {
            text: request.request.postData.text
          }
        },
        response: {
          status: request.response.status,
          content: {
            size: request.response.content.size
          }
        },
        time: request.time,
        isCors,
        isError: !!responseJSON?.error,
        isWarning: !responseJSON,
        isWebSocket: false,
        requestJSON,
        rawRequest,
        responseJSON,
        rawResponse
      });
      resolve(requests);
    } else {
      const responseJSONIndex = responseJSON.reduce((acc, item) => {
        acc[item.id] = item;
        return acc;
      }, {});

      requestJSON.forEach((requestJSONItem) => {
        requests.push({
          uuid: uuid(),
          startTime,
          request: {
            url: request.request.url,
            method: request.request.method,
            headers: request.request.headers,
            postData: {
              text: request.request.postData.text
            }
          },
          response: {
            status: request.response.status,
            content: {
              size: request.response.content.size
            }
          },
          time: request.time,
          isCors,
          isError: !!requestJSONItem?.error,
          isWarning: !requestJSONItem,
          isWebSocket: false,
          requestJSON: requestJSONItem,
          rawRequest,
          responseJSON: responseJSONIndex[requestJSONItem.id],
          rawResponse
        });
      });

      resolve(requests);
    }
  });
});
