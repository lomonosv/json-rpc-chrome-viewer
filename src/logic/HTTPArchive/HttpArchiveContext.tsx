import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useSettingsContext } from '~/logic/SettingsContext/SettingsContext';
import {
  isJsonRpcRequest,
  isJsonRpcMessage,
  getPreparedHttpRequest,
  getPreparedInterceptedRequest,
  getPreparedMessage,
  getPreparedObservedRequest,
  getPreparedPendingRequest,
  getPreparedServerRequests,
  getRequestLabel,
  matchesFilter,
  parseJsonRpcMessage
} from '~/logic/HTTPArchive/filters';
import { IRequest } from '~/logic/HTTPArchive/IRequest';
import { SortDirection, SortField } from '~/logic/HTTPArchive/SortField';
import { MessageType } from '~/logic/common/messages';
import {
  getServerLogCalls,
  hasServerLog,
  isDocumentRequest
} from '~/logic/HTTPArchive/serverLog';
import { getDocumentTimeOrigin } from '~/logic/HTTPArchive/documentTimeOrigin';
import {
  IInterceptedRequestPayload,
  IObservedRequestPayload,
  IPendingRequestPayload
} from '~/logic/Interceptor/IInterceptorRule';

const findPendingIndex = (requests: IRequest[], item: IRequest): number => {
  if (item.requestJSON?.id === undefined || item.requestJSON?.id === null) {
    return -1;
  }

  if (item.callId) {
    return requests.findIndex((existing) => (
      existing.isPending &&
      existing.callId === item.callId &&
      existing.requestJSON?.id === item.requestJSON.id
    ));
  }

  return requests.findIndex((existing) => (
    existing.isPending &&
    existing.request.url === item.request.url &&
    existing.requestJSON?.id === item.requestJSON.id
  ));
};

const duplicateCompletionWindowMs = 5000;

// Server-side rows are excluded: an SSR render calling the app's own endpoint
// with small incrementing ids would otherwise match a browser call to the same
// url and id moments later, and the browser's real row would be dropped as a
// duplicate of the server's.
const findCompletedIndex = (requests: IRequest[], url: string, id: unknown, startTime: number): number => (
  requests.findIndex((existing) => (
    !existing.isPending &&
    !existing.isServerSide &&
    existing.request.url === url &&
    existing.requestJSON?.id === id &&
    Math.abs(existing.startTime - startTime) < duplicateCompletionWindowMs
  ))
);

const mergeCompletedRequests = (requests: IRequest[], completed: IRequest[]): IRequest[] => (
  completed.reduce((acc, item) => {
    const pendingIndex = findPendingIndex(acc, item);

    if (pendingIndex !== -1) {
      const merged = { ...item, uuid: acc[pendingIndex].uuid };

      return acc.map((existing, index) => (index === pendingIndex ? merged : existing));
    }

    const hasId = item.requestJSON?.id !== undefined && item.requestJSON?.id !== null;

    if (hasId && findCompletedIndex(acc, item.request.url, item.requestJSON.id, item.startTime) !== -1) {
      return acc;
    }

    return [...acc, item];
  }, requests)
);

/**
 * Server rows are appended directly rather than through `mergeCompletedRequests`:
 * they are never pending, and the (url, id) de-duplication there is a heuristic
 * for the browser's own reports, which a server's calls must not take part in.
 */
const getServerRequests = async (request: chrome.devtools.network.Request): Promise<IRequest[]> => (
  (await getServerLogCalls(request)).flatMap(getPreparedServerRequests)
);

// Slack between the renderer's `timeOrigin` and the wall clock HAR stamps
// `startedDateTime` with. Erring wide can keep a few rows from the page being
// left; it can never drop one from the page that loaded.
const documentClockSkewMs = 500;

const getStartedAt = (request: chrome.devtools.network.Request): number => {
  const startedAt = Date.parse(request.startedDateTime);

  return Number.isNaN(startedAt) ? Date.now() : startedAt;
};

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
  // Server row uuid → browser start of the response that carried it. The row's
  // own `startTime` is on the server's clock, which may be skewed.
  const carrierStartsRef = useRef(new Map<string, number>());

  const {
    preserveLog,
    includeJsonRpcLogs,
    includeWebsocketLogs,
    includeServerLogs,
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
    carrierStartsRef.current.clear();
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

  const appendServerRequests = (request: chrome.devtools.network.Request, serverRequests: IRequest[]) => {
    if (!serverRequests.length) return;

    const carrierStart = getStartedAt(request);

    serverRequests.forEach(({ uuid }) => carrierStartsRef.current.set(uuid, carrierStart));

    requestsRef.current = [
      ...requestsRef.current,
      ...serverRequests
    ];

    setRequests(requestsRef.current);
  };

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

    // After the browser rows, not alongside them: a slow drain endpoint must
    // not hold back the backlog that was already in hand.
    const carriers = await Promise.all(
      e.detail.filter(({ request }) => hasServerLog(request)).map(
        async ({ request }) => ({ request, serverRequests: await getServerRequests(request) })
      )
    );

    carriers.forEach(({ request, serverRequests }) => appendServerRequests(request, serverRequests));
  }, [requestsRef.current, setRequests]);

  /**
   * Drops every row that started before the inspected document did, and keeps
   * the rest. Resolves `false` when the document's `timeOrigin` is unreadable.
   *
   * This replaces pairing `onNavigated` with its document, which lost server
   * rows — they arrive once, with the document, so a wrong clear is final. The
   * event is not ordered against the document's `onRequestFinished`, and it
   * also fires for pushState/replaceState, which Next's App Router calls during
   * hydration. A time cut needs neither answer: a soft navigation drops nothing,
   * a reload drops exactly the previous page, and running it twice is harmless.
   */
  const pruneToCurrentDocument = useCallback(async (): Promise<boolean> => {
    const timeOrigin = await getDocumentTimeOrigin();

    if (timeOrigin === null) return false;

    const threshold = timeOrigin - documentClockSkewMs;
    const kept = requestsRef.current.filter(({ uuid, startTime }) => (
      (carrierStartsRef.current.get(uuid) ?? startTime) >= threshold
    ));

    if (kept.length !== requestsRef.current.length) {
      const keptIds = new Set(kept.map(({ uuid }) => uuid));

      carrierStartsRef.current = new Map([...carrierStartsRef.current].filter(([uuid]) => keptIds.has(uuid)));
      requestsRef.current = kept;
      setRequests(requestsRef.current);
    }

    return true;
  }, []);

  const handleNavigation = useCallback(async () => {
    if (await pruneToCurrentDocument()) return;

    // Unreadable document: fall back to the plain clear-on-navigate.
    carrierStartsRef.current.clear();
    requestsRef.current = [];
    setRequests(requestsRef.current);
  }, []);

  const handleRequest = useCallback(async (request: chrome.devtools.network.Request) => {
    if (isJsonRpcRequest(request)) {
      const preparedRequest = await getPreparedHttpRequest(request);

      requestsRef.current = mergeCompletedRequests(requestsRef.current, preparedRequest);

      setRequests(requestsRef.current);
    }

    // Not an `else`: a response can be both a browser JSON-RPC call and the
    // carrier of the server calls made while answering it — a route handler
    // that forwards upstream, for one.
    if (hasServerLog(request)) {
      appendServerRequests(request, await getServerRequests(request));
    }

    // Again on a document's finish: the `onNavigated` eval can still land in
    // the outgoing document, which cuts at the old origin and keeps everything.
    if (!preserveLog && isDocumentRequest(request)) {
      pruneToCurrentDocument();
    }
  }, [requestsRef.current, setRequests, preserveLog]);

  const handleRuntimeMessage = useCallback((
    message: {
      type: MessageType,
      payload: (IInterceptedRequestPayload | IPendingRequestPayload) & {
        type?: 'income' | 'outcome',
        message?: string,
      },
    },
    sender: chrome.runtime.MessageSender
  ) => {
    if (sender?.tab?.id !== chrome.devtools.inspectedWindow.tabId) {
      return;
    }

    if (message.type === MessageType.InterceptedRequest) {
      requestsRef.current = [
        ...requestsRef.current,
        ...getPreparedInterceptedRequest(message.payload as IInterceptedRequestPayload)
      ];

      setRequests(requestsRef.current);

      return;
    }

    if (message.type === MessageType.PendingRequest) {
      const payload = message.payload as IPendingRequestPayload;
      const isAlreadyCompleted =
        findCompletedIndex(requestsRef.current, payload.url, payload.id, payload.startTime) !== -1;

      if (!isAlreadyCompleted) {
        requestsRef.current = [
          ...requestsRef.current,
          getPreparedPendingRequest(payload)
        ];

        setRequests(requestsRef.current);
      }

      return;
    }

    if (message.type === MessageType.ObservedRequest) {
      const completed = getPreparedObservedRequest(message.payload as IObservedRequestPayload);

      requestsRef.current = mergeCompletedRequests(requestsRef.current, completed);

      setRequests(requestsRef.current);

      return;
    }

    if (message.type === MessageType.WebsocketMessage && isJsonRpcMessage(message.payload.message)) {
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

      // Before the `requestJSON` branch, since server rows carry one too and
      // would otherwise be governed by the browser JSON-RPC toggle.
      if (request.isServerSide) {
        return includeServerLogs && matchesFilter(request, filter, searchScope, caseSensitiveSearch);
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
    includeServerLogs,
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
