import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useSettingsContext } from '../SettingsContext';
import { isJsonRpcRequest, getPreparedRequest } from './filters';
import { IRequest } from './IRequest';

const useRequest = () => {
  const [selected, setSelected] = useState<IRequest>(null);
  const [requests, setRequests] = useState<IRequest[]>([]);
  const requestsRef = useRef<IRequest[]>([]);

  const { preserveLog } = useSettingsContext();

  const handleInitialRequestsData = async (e: CustomEvent<chrome.devtools.network.Request[]>) => {
    const requests = await Promise.all(
      e.detail.filter(isJsonRpcRequest).map((item) => getPreparedRequest(item))
    );
    requestsRef.current = requests.flat();
    setRequests(requestsRef.current);
  };

  const handleNavigation = () => {
    requestsRef.current = [];
    setRequests(requestsRef.current);
  };

  const handleRequest = async (request: chrome.devtools.network.Request) => {
    if (isJsonRpcRequest(request)) {
      requestsRef.current = [
        ...requestsRef.current,
        ...await getPreparedRequest(request)
      ];
      setRequests(requestsRef.current);
    }
  };

  useEffect(() => {
    chrome.devtools.network.onRequestFinished.addListener(handleRequest);
    !preserveLog && chrome.devtools.network.onNavigated.addListener(handleNavigation);
    window.addEventListener('INITIAL_REQUESTS_DATA', handleInitialRequestsData);

    return () => {
      chrome.devtools.network.onRequestFinished.removeListener(handleRequest);
      !preserveLog && chrome.devtools.network.onNavigated.removeListener(handleNavigation);
      window.removeEventListener('INITIAL_REQUESTS_DATA', handleInitialRequestsData);
    };
  }, []);

  return {
    requests,
    selected,
    setSelected
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
