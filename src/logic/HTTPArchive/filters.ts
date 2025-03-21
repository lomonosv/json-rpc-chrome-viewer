import { v4 as uuid } from 'uuid';
import { IRequest, JSONValue } from '~/logic/HTTPArchive/IRequest';

export const isJsonRpcRequest = (request: chrome.devtools.network.Request) => (
  request.request &&
  request.request.postData &&
  request.request.postData.mimeType &&
  request.request.postData.mimeType.match(/application\/json/) &&
  request.request.postData.text && request.request.postData.text.match(/jsonrpc/)
);

export const isJsonRpcMessage = (message: string) => (
  message.match(/jsonrpc/)
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

export const getPreparedMessage = (
  type: 'income' | 'outcome',
  url: string,
  json: JSONValue & { method: string, id: string }
): IRequest => ({
  uuid: uuid(),
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

    if (!isBatch) {
      requests.push({
        uuid: uuid(),
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
