import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import { useSettingsContext } from '~/logic/SettingsContext/SettingsContext';
import { isJsonRpcRequest, getPreparedRequest } from '~/logic/HTTPArchive/filters';
import { IRequest } from '~/logic/HTTPArchive/IRequest';

const useRequest = () => {
  const [selected, setSelected] = useState<IRequest>(null);
  const [filter, setFilter] = useState<string>('');
  const [requests, setRequests] = useState<IRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<IRequest[]>([]);
  const requestsRef = useRef<IRequest[]>([]);

  const { preserveLog } = useSettingsContext();

  const clear = () => {
    requestsRef.current = [];
    setRequests(requestsRef.current);
    setSelected(null);
  };

  const clearSelection = () => {
    setSelected(null);
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!selected) {
      return;
    }

    let index = filteredRequests.findIndex(({ uuid }) => selected.uuid === uuid);

    if (e.key === 'ArrowUp') {
      index -= 1;
    } else if (e.key === 'ArrowDown') {
      index += 1;
    }

    if (index < 0) {
      setSelected(filteredRequests[filteredRequests.length - 1]);
    } else if (index > filteredRequests.length - 1) {
      setSelected(filteredRequests[0]);
    } else {
      setSelected(filteredRequests[index]);
    }
  }, [filteredRequests, selected]);

  const handleInitialRequestsData = useCallback(async (e: CustomEvent<{
    request: chrome.devtools.network.Request,
    responseContent: string
  }[]>) => {
    const requests = await Promise.all(
      e.detail.filter(({ request }) => isJsonRpcRequest(request)).map(
        ({ request, responseContent }) => getPreparedRequest(request, responseContent)
      )
    );

    requestsRef.current = [
      ...requestsRef.current,
      ...requests.flat()
    ];

    setRequests(requestsRef.current);
  }, [requestsRef.current, setRequests]);

  const handleNavigation = useCallback(() => {
    requestsRef.current = [];
    setRequests(requestsRef.current);
  }, [requestsRef.current, setRequests]);

  const handleRequest = useCallback(async (request: chrome.devtools.network.Request) => {
    if (isJsonRpcRequest(request)) {
      const preparedRequest = await getPreparedRequest(request);

      requestsRef.current = [
        ...requestsRef.current,
        ...preparedRequest
      ];

      setRequests(requestsRef.current);
    }
  }, [requestsRef.current, setRequests]);

  const handleRuntimeMessage = useCallback((message) => {
    if (message.type === 'JSON_RPC_WEBSOCKET_MESSAGE') {
      console.log('Received WebSocket data in background:', message.payload);

      try {
        const jsonParserRegex = /[^"]*"(.+)"[^"]*/;
        if (message.payload.message.match(/jsonrpc/)) {
          const json = JSON.parse(message.payload.message.replace(jsonParserRegex, '$1').replaceAll('\\', ''));

          console.log(json);

          const preparedRequest = [{
            uuid: uuid(),
            isCors: false,
            isError: false,
            isWarning: false,
            request: {
              url: 'websocket'
            },
            response: {
              status: 200,
              content: {
                size: 1
              }
            },
            time: 0,
            requestJSON: {
              id: json.id,
              jsonrpc: json.jsonrpc,
              method: json.method || '',
              params: json.params
            },
            rawRequest: '',
            responseJSON: {
              id: json.id,
              jsonrpc: json.jsonrpc,
              error: {
                code: 0,
                message: ''
              },
              result: {}
            },
            rawResponse: ''
          }];

          // @ts-ignore
          requestsRef.current = [
            ...requestsRef.current,
            ...preparedRequest
          ];

          setRequests(requestsRef.current);
        }
      } catch (error) { /* empty */ }
    }
  }, []);

  useEffect(() => {
    chrome.devtools.network.onRequestFinished.addListener(handleRequest);
    chrome.runtime.onMessage.addListener(handleRuntimeMessage);
    !preserveLog && chrome.devtools.network.onNavigated.addListener(handleNavigation);
    window.addEventListener('INITIAL_REQUESTS_DATA', handleInitialRequestsData);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      chrome.devtools.network.onRequestFinished.removeListener(handleRequest);
      chrome.runtime.onMessage.removeListener(handleRuntimeMessage);
      !preserveLog && chrome.devtools.network.onNavigated.removeListener(handleNavigation);
      window.removeEventListener('INITIAL_REQUESTS_DATA', handleInitialRequestsData);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [preserveLog]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [requests, filteredRequests, selected]);

  useEffect(() => {
    const filteredRequests = requests.filter((request) => (
      request.requestJSON
        ? request.requestJSON.method.toLowerCase().includes(filter.toLowerCase())
        : true
    ));

    setFilteredRequests(filteredRequests);

    if (!filteredRequests.some(({ uuid }) => uuid === selected?.uuid)) {
      clearSelection();
    }
  }, [requests, filter]);

  return {
    requests: filteredRequests,
    selected,
    filter,
    setSelected,
    setFilter,
    clear,
    clearSelection
  };
};

type RequestContextType = ReturnType<typeof useRequest>;

export const RequestContext = createContext<RequestContextType>(null);

export const useRequestContext = (): RequestContextType => (
  useContext<RequestContextType>(RequestContext)
);

interface IComponentProps {
  children: React.ReactElement
}

const RequestContextProvider: React.FC<IComponentProps> = ({ children }) => (
  <RequestContext.Provider value={ useRequest() }>
    { children }
  </RequestContext.Provider>
);

export default RequestContextProvider;
