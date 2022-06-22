import React, { createContext, useContext, useEffect } from 'react';

const useRequest = () => {
  const handleRequest = (request: chrome.devtools.network.Request) => {
    console.log(request);
  };

  useEffect(() => {
    chrome.devtools.network.onRequestFinished.addListener(handleRequest);
    return () => {
      chrome.devtools.network.onRequestFinished.removeListener(handleRequest);
    };
  }, []);

  return {};
};

type RequestContextType = ReturnType<typeof useRequest>;

export const RequestContext = createContext<RequestContextType>(null);

export const useRequestContext = (): RequestContextType => (
  useContext<RequestContextType>(RequestContext)
);

interface IProps {
  children: React.ReactElement
}

const RequestContextProvider: React.FC<IProps> = ({ children }) => (
  <RequestContext.Provider value={ useRequest() }>
    { children }
  </RequestContext.Provider>
);

export default RequestContextProvider;
