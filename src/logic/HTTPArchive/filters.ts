import { v4 as uuid } from 'uuid';
import { IRequest } from './IRequest';

export const isJsonRpcRequest = (request: chrome.devtools.network.Request) => (
  request.request &&
  request.request.postData &&
  request.request.postData.mimeType &&
  request.request.postData.mimeType.match(/application\/json/) &&
  request.request.postData.text && request.request.postData.text.match(/jsonrpc/)
);

export const getPreparedRequest = async (
  request: chrome.devtools.network.Request
): Promise<IRequest[]> => new Promise((resolve) => {
  const requests: IRequest[] = [];

  request.getContent((body) => {
    const responseJSON = JSON.parse(body);
    const requestJSON = JSON.parse(request.request.postData.text);
    const isBatch = Array.isArray(requestJSON) && Array.isArray(responseJSON);

    const origin = request.request.headers.find(({ name }) => name === 'origin');
    const host = origin ? origin.value : '';

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
