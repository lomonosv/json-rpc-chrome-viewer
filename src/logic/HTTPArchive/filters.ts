import { v4 as uuid } from 'uuid';
import { IRequest } from '~/logic/HTTPArchive/IRequest';

export const isJsonRpcRequest = (request: chrome.devtools.network.Request) => (
  request.request &&
  request.request.postData &&
  request.request.postData.mimeType &&
  request.request.postData.mimeType.match(/application\/json/) &&
  request.request.postData.text && request.request.postData.text.match(/jsonrpc/)
);

export const getPreparedRequest = async (
  request: chrome.devtools.network.Request,
  responseContent?: string
): Promise<IRequest[]> => new Promise((resolve) => {
  const requests: IRequest[] = [];

  request.getContent((body) => {
    const responseJSON = JSON.parse(responseContent || body);
    const requestJSON = JSON.parse(request.request.postData.text);
    const isBatch = Array.isArray(requestJSON) && Array.isArray(responseJSON);

    const referer = request.request.headers.find(({ name }) => name.toLowerCase() === 'referer');
    const host = referer ? referer.value.replace(/(.+:\/\/)([^/]+)(\/?.*)/, '$2') : '';

    const isCors = !request.request.url.includes(host);

    if (!isBatch) {
      requests.push({
        uuid: uuid(),
        ...request,
        isCors,
        requestJSON,
        responseJSON
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
          ...request,
          isCors,
          requestJSON: requestJSONItem,
          responseJSON: responseJSONIndex[requestJSONItem.id]
        });
      });

      resolve(requests);
    }
  });
});
