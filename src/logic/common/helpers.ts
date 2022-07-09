export const getConfig = (key: string, defaultValue: boolean | string | number) => new Promise((resolve) => {
  chrome.storage.local.get([key], (result) => {
    if (result[key] !== undefined) {
      resolve(result[key]);
    } else {
      chrome.storage.local.set({ [key]: defaultValue });
      resolve(defaultValue);
    }
  });
});
