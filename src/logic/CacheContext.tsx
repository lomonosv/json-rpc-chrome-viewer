import React, { createContext, useContext, useState } from 'react';

const useCache = () => {
  const [requestSectionHeight, setRequestSectionHeight] = useState<number>(115);

  return {
    requestSectionHeight,
    setRequestSectionHeight
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
