import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { isJsonRpcRequest } from '../filters';

const useRequest = () => {
  const [requests, setRequests] = useState<chrome.devtools.network.Request[]>([]);
  const requestsRef = useRef<chrome.devtools.network.Request[]>([]);

  const handleInitialRequestsData = (e: CustomEvent<chrome.devtools.network.Request[]>) => {
    requestsRef.current = e.detail.filter(isJsonRpcRequest);
    setRequests(requestsRef.current);
  };

  const handleNavigation = () => {
    requestsRef.current = [];
    setRequests(requestsRef.current);
  };

  const handleRequest = (request: chrome.devtools.network.Request) => {
    if (isJsonRpcRequest(request)) {
      requestsRef.current.push(request);
      setRequests(requestsRef.current);
    }
  };

  useEffect(() => {
    chrome.devtools.network.onRequestFinished.addListener(handleRequest);
    chrome.devtools.network.onNavigated.addListener(handleNavigation);
    window.addEventListener('INITIAL_REQUESTS_DATA', handleInitialRequestsData);

    return () => {
      chrome.devtools.network.onRequestFinished.removeListener(handleRequest);
      chrome.devtools.network.onNavigated.removeListener(handleNavigation);
      window.removeEventListener('INITIAL_REQUESTS_DATA', handleInitialRequestsData);
    };
  }, []);

  console.log(requests);

  return {
    requests
  };
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