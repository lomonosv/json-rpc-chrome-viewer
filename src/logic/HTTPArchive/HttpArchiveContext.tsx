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
  getNavigationKey,
  getServerLogCalls,
  hasServerLog,
  isDocumentRequest
} from '~/logic/HTTPArchive/serverLog';
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

/**
 * A document whose server rows landed before the `onNavigated` for the very
 * navigation it belongs to. See `useRequest`'s navigation bookkeeping.
 */
interface ILateDocument {
  key: string,
  seenAt: number,
  uuids: string[],
}

// How long a finished document waits for its own navigation event before its
// rows are treated as belonging to the previous page after all.
const lateDocumentWindowMs = 3000;

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
  // Navigations whose document has not finished yet — the normal order.
  const pendingNavigationsRef = useRef<string[]>([]);
  // Documents that finished before their own navigation event — the late order.
  const lateDocumentsRef = useRef<ILateDocument[]>([]);

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

  /**
   * Appends a document's server rows and pairs the document with its navigation.
   *
   * **`onNavigated` can arrive after the document has finished and been drained.**
   * The two come from different CDP domains — `Network.loadingFinished` from the
   * browser process, the frame commit from the renderer — so nothing orders
   * them, and on a fast local document the finish regularly wins by up to a
   * second. `handleNavigation` then wipes rows that belong to the page it is
   * announcing; browser rows recover because the page keeps making calls, server
   * rows never do, so they showed for a moment and vanished (with Preserve log
   * off). The document and the navigation are therefore matched by url in
   * whichever order they land: a navigation seen first is consumed here, a
   * document seen first is remembered so the navigation can keep its rows.
   */
  const appendServerRequests = (request: chrome.devtools.network.Request, serverRequests: IRequest[]) => {
    if (!serverRequests.length) return;

    requestsRef.current = [
      ...requestsRef.current,
      ...serverRequests
    ];

    setRequests(requestsRef.current);

    if (!isDocumentRequest(request)) return;

    const key = getNavigationKey(request.request.url);
    const pendingIndex = pendingNavigationsRef.current.indexOf(key);

    if (pendingIndex !== -1) {
      pendingNavigationsRef.current.splice(pendingIndex, 1);

      return;
    }

    lateDocumentsRef.current = [
      ...lateDocumentsRef.current.slice(-4),
      { key, seenAt: Date.now(), uuids: serverRequests.map(({ uuid }) => uuid) }
    ];
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

  const handleNavigation = useCallback((url: string) => {
    const key = getNavigationKey(url);
    const now = Date.now();
    const lateDocument = lateDocumentsRef.current.find((document) => (
      document.key === key && now - document.seenAt < lateDocumentWindowMs
    ));

    lateDocumentsRef.current = [];

    if (lateDocument) {
      // This navigation's document already finished; its rows are the new page.
      const keep = new Set(lateDocument.uuids);

      requestsRef.current = requestsRef.current.filter(({ uuid }) => keep.has(uuid));
      pendingNavigationsRef.current = [];
    } else {
      requestsRef.current = [];
      pendingNavigationsRef.current = [key];
    }

    setRequests(requestsRef.current);
  }, [requestsRef.current, setRequests]);

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
  }, [requestsRef.current, setRequests]);

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
