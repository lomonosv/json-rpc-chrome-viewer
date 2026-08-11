import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useSettingsContext } from '~/logic/SettingsContext/SettingsContext';
import {
  isJsonRpcRequest,
  isJsonRpcMessage,
  getPreparedHttpRequest,
  getPreparedMessage,
  getRequestLabel,
  matchesFilter,
  parseJsonRpcMessage
} from '~/logic/HTTPArchive/filters';
import { IRequest } from '~/logic/HTTPArchive/IRequest';
import { SortDirection, SortField } from '~/logic/HTTPArchive/SortField';

const getSortValue = (request: IRequest, field: SortField): string | number => {
  switch (field) {
    case SortField.Method:
      return getRequestLabel(request).toLowerCase();
    case SortField.Status:
      return request.response.status;
    case SortField.Size:
      return request.response.content.size;
    case SortField.Time:
      return request.time;
    default:
      return request.startTime;
  }
};

const useRequest = () => {
  const [selected, setSelected] = useState<IRequest>(null);
  const [filter, setFilter] = useState<string>('');
  const [requests, setRequests] = useState<IRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<IRequest[]>([]);
  const [sortField, setSortField] = useState<SortField>(SortField.Waterfall);
  const [sortDirection, setSortDirection] = useState<SortDirection>(SortDirection.Asc);
  const requestsRef = useRef<IRequest[]>([]);

  const {
    preserveLog,
    includeJsonRpcLogs,
    includeWebsocketLogs,
    searchScope,
    caseSensitiveSearch,
    showWaterfallColumn,
    showStatusColumn,
    showSizeColumn,
    showTimeColumn
  } = useSettingsContext();

  const isColumnVisible = {
    [SortField.Method]: true,
    [SortField.Waterfall]: showWaterfallColumn,
    [SortField.Status]: showStatusColumn,
    [SortField.Size]: showSizeColumn,
    [SortField.Time]: showTimeColumn
  };

  const fallbackSortField = showWaterfallColumn ? SortField.Waterfall : SortField.Method;
  const effectiveSortField = isColumnVisible[sortField] ? sortField : fallbackSortField;

  const clear = () => {
    requestsRef.current = [];
    setRequests(requestsRef.current);
    setSelected(null);
  };

  const clearSelection = () => {
    setSelected(null);
  };

  const toggleSort = (field: SortField) => {
    if (field === effectiveSortField) {
      setSortDirection(sortDirection === SortDirection.Asc ? SortDirection.Desc : SortDirection.Asc);
      return;
    }

    setSortField(field);
    setSortDirection(SortDirection.Asc);
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
    responseContent: string,
  }[]>) => {
    const requests = await Promise.all(
      e.detail.filter(({ request }) => isJsonRpcRequest(request)).map(
        ({ request, responseContent }) => getPreparedHttpRequest(request, responseContent)
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
      const preparedRequest = await getPreparedHttpRequest(request);

      requestsRef.current = [
        ...requestsRef.current,
        ...preparedRequest
      ];

      setRequests(requestsRef.current);
    }
  }, [requestsRef.current, setRequests]);

  const handleRuntimeMessage = useCallback((
    message: {
      type: string,
      payload: { type: 'income' | 'outcome', url: string, message: string },
    }
  ) => {
    if (message.type === 'JSON_RPC_WEBSOCKET_MESSAGE' && isJsonRpcMessage(message.payload.message)) {
      const json = parseJsonRpcMessage(message.payload.message);

      if (!json) return;

      const preparedRequest = getPreparedMessage(message.payload.type, message.payload.url, json);

      requestsRef.current = [
        ...requestsRef.current,
        preparedRequest
      ];

      setRequests(requestsRef.current);
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
    const filteredRequests = requests.filter((request) => {
      if (request.isWebSocket) {
        return includeWebsocketLogs && matchesFilter(request, filter, searchScope, caseSensitiveSearch);
      }

      if (request.requestJSON) {
        return includeJsonRpcLogs && matchesFilter(request, filter, searchScope, caseSensitiveSearch);
      }

      return true;
    }).sort((a, b) => {
      const aValue = getSortValue(a, effectiveSortField);
      const bValue = getSortValue(b, effectiveSortField);

      if (aValue === bValue) {
        return a.startTime - b.startTime;
      }

      const result = aValue > bValue ? 1 : -1;

      return sortDirection === SortDirection.Asc ? result : -result;
    });

    setFilteredRequests(filteredRequests);

    if (!filteredRequests.some(({ uuid }) => uuid === selected?.uuid)) {
      clearSelection();
    }
  }, [
    requests,
    filter,
    searchScope,
    caseSensitiveSearch,
    includeJsonRpcLogs,
    includeWebsocketLogs,
    effectiveSortField,
    sortDirection
  ]);

  return {
    requests: filteredRequests,
    sortField: effectiveSortField,
    sortDirection,
    toggleSort,
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
  children: React.ReactElement,
}

const RequestContextProvider: React.FC<IComponentProps> = ({ children }) => (
  <RequestContext.Provider value={ useRequest() }>
    { children }
  </RequestContext.Provider>
);

export default RequestContextProvider;
