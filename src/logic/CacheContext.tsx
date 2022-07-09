import React, { createContext, useContext, useState, useEffect } from 'react';
import { getConfig } from './helpers';

const defaultRequestSectionHeight = 115;
const defaultRequestListSectionWidth = 200;

const useCache = () => {
  const [requestSectionHeight, setRequestSectionHeight] = useState<number>(defaultRequestSectionHeight);
  const [requestListSectionWidth, setRequestListSectionWidth] = useState<number>(defaultRequestListSectionWidth);

  useEffect(() => {
    getConfig('requestSectionHeight', defaultRequestSectionHeight).then(setRequestSectionHeight);
    getConfig('requestListSectionWidth', defaultRequestListSectionWidth).then(setRequestListSectionWidth);
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

interface IComponentProps {
  children: React.ReactElement
}

const CacheContextProvider: React.FC<IComponentProps> = ({ children }) => (
  <CacheContext.Provider value={ useCache() }>
    { children }
  </CacheContext.Provider>
);

export default CacheContextProvider;
