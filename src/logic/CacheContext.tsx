import React, { createContext, useContext, useState, useEffect } from 'react';

const defaultRequestSectionHeight = 115;
const defaultRequestListSectionWidth = 200;

const useCache = () => {
  const [requestSectionHeight, setRequestSectionHeight] = useState<number>(defaultRequestSectionHeight);
  const [requestListSectionWidth, setRequestListSectionWidth] = useState<number>(defaultRequestListSectionWidth);

  useEffect(() => {
    chrome.storage.local.get(['requestSectionHeight'], ({ requestSectionHeight }) => {
      if (requestSectionHeight) {
        setRequestSectionHeight(requestSectionHeight);
      } else {
        chrome.storage.local.set({ requestSectionHeight: defaultRequestSectionHeight });
        setRequestSectionHeight(defaultRequestSectionHeight);
      }
    });

    chrome.storage.local.get(['requestListSectionWidth'], ({ requestListSectionWidth }) => {
      if (requestListSectionWidth) {
        setRequestListSectionWidth(requestListSectionWidth);
      } else {
        chrome.storage.local.set({ requestListSectionWidth: defaultRequestListSectionWidth });
        setRequestListSectionWidth(defaultRequestListSectionWidth);
      }
    });
  }, []);

  const updateRequestSectionHeight = (requestSectionHeight) => {
    setRequestSectionHeight(requestSectionHeight);
    chrome.storage.local.set({ requestSectionHeight });
  };

  const updateRequestListSectionWidth = (requestListSectionWidth) => {
    setRequestListSectionWidth(requestListSectionWidth);
    chrome.storage.local.set({ requestListSectionWidth });
  };

  return {
    requestSectionHeight,
    updateRequestSectionHeight,
    requestListSectionWidth,
    updateRequestListSectionWidth
  };
};

type CacheContextType = ReturnType<typeof useCache>;

export const CacheContext = createContext<CacheContextType>(null);

export const useCacheContext = (): CacheContextType => (
  useContext<CacheContextType>(CacheContext)
);

interface IProps {
  children: React.ReactElement
}

const CacheContextProvider: React.FC<IProps> = ({ children }) => (
  <CacheContext.Provider value={ useCache() }>
    { children }
  </CacheContext.Provider>
);

export default CacheContextProvider;
