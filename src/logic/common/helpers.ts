import { Json2Ts } from 'json2ts/src/json2ts';
import { JSONValue } from '~/logic/HTTPArchive/IRequest';

export const isExtensionAlive = () => (
  !!chrome?.storage?.local && !!chrome?.runtime?.id
);

export const setConfig = (values: Record<string, unknown>): Promise<void> => {
  if (!isExtensionAlive()) {
    return Promise.resolve();
  }

  return chrome.storage.local.set(values);
};

export const getConfig = (
  key: string,
  defaultValue: boolean | string | number | object
) => new Promise((resolve) => {
  if (!isExtensionAlive()) {
    resolve(defaultValue);

    return;
  }

  chrome.storage.local.get([key], (result) => {
    if (result[key] !== undefined) {
      resolve(result[key]);
    } else {
      chrome.storage.local.set({ [key]: defaultValue });
      resolve(defaultValue);
    }
  });
});

export const formatJson = (json: JSONValue) => JSON.stringify(json, null, 2);

export const convertJsonToTS = (json: JSONValue) => {
  try {
    return new Json2Ts().convert(JSON.stringify(json));
  } catch (error) {
    return null;
  }
};
