const panels = chrome && chrome.devtools && chrome.devtools.panels;
const httpArchiveRequests = [];

// Mirrors the panel's `pruneToCurrentDocument`, which owns the explanation:
// on navigation keep only what started after the current document did, since
// `onNavigated` is neither ordered against the document's finish nor limited
// to real page loads.
const documentClockSkewMs = 500;

const getDocumentTimeOrigin = (callback) => {
  try {
    chrome.devtools.inspectedWindow.eval('performance.timeOrigin', (result, exceptionInfo) => {
      callback(!exceptionInfo && typeof result === 'number' ? result : null);
    });
  } catch (error) {
    callback(null);
  }
};

const getStartedAt = (request) => {
  const startedAt = Date.parse(request.startedDateTime);

  return Number.isNaN(startedAt) ? Date.now() : startedAt;
};

const callback = (panel) => {
  const pruneToCurrentDocument = () => {
    chrome.storage.local.get(['settings_preserveLog'], (result) => {
      if (result.settings_preserveLog) return;

      getDocumentTimeOrigin((timeOrigin) => {
        // Unreadable document: fall back to the plain clear.
        const kept = timeOrigin === null ? [] : httpArchiveRequests.filter(({ request }) => (
          getStartedAt(request) >= timeOrigin - documentClockSkewMs
        ));

        httpArchiveRequests.splice(0, httpArchiveRequests.length, ...kept);
      });
    });
  };

  const handleRequest = (httpArchiveRequest) => {
    httpArchiveRequest.getContent((responseContent) => {
      httpArchiveRequests.push({
        request: httpArchiveRequest,
        responseContent
      });

      if (httpArchiveRequest._resourceType === 'document') pruneToCurrentDocument();
    });
  };

  chrome.devtools.network.onRequestFinished.addListener(handleRequest);
  chrome.devtools.network.onNavigated.addListener(pruneToCurrentDocument);

  panel.onShown.addListener(function handlePanelShown(panelWindow) {
    chrome.devtools.network.onNavigated.removeListener(pruneToCurrentDocument);
    panel.onShown.removeListener(handlePanelShown); // Run once only
    chrome.devtools.network.onRequestFinished.removeListener(handleRequest);

    // A copy: a prune still in flight must not splice the backlog out from
    // under the panel while it reads it.
    panelWindow.dispatchEvent(new CustomEvent('INITIAL_REQUESTS_DATA', {
      detail: [...httpArchiveRequests]
    }));
  });
}

panels.create('JSON-RPC Chrome Viewer', 'icons/16.png', 'application.html', callback);
