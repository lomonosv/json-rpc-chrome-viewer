const panels = chrome && chrome.devtools && chrome.devtools.panels;
const httpArchiveRequests = [];

const callback = (panel) => {
  const handleRequest = (httpArchiveRequest) => {
    httpArchiveRequest.getContent((responseContent) => {
      httpArchiveRequests.push({
        request: httpArchiveRequest,
        responseContent,
        pushedAt: Date.now()
      });
    });
  };

  // `onNavigated` can land after the navigation's own document has finished —
  // the two are not ordered — so a blind clear would drop the page-load
  // document that carries the server-side calls. Keep the most recent document
  // for the navigated url if it arrived just before; everything else goes.
  // Mirrors the panel's `handleNavigation`, which owns the fuller explanation.
  const lateDocumentWindowMs = 3000;
  const getNavigationKey = (url) => url.split('#')[0];

  const handleNavigation = (url) => {
    chrome.storage.local.get(['settings_preserveLog'], (result) => {
      if (result.settings_preserveLog) return;

      const key = getNavigationKey(url);
      const now = Date.now();
      const kept = httpArchiveRequests.filter(({ request, pushedAt }) => (
        request._resourceType === 'document' &&
        getNavigationKey(request.request.url) === key &&
        now - pushedAt < lateDocumentWindowMs
      )).slice(-1);

      httpArchiveRequests.splice(0, httpArchiveRequests.length, ...kept);
    });
  }

  chrome.devtools.network.onRequestFinished.addListener(handleRequest);
  chrome.devtools.network.onNavigated.addListener(handleNavigation);

  panel.onShown.addListener(function handlePanelShown(panelWindow) {
    chrome.devtools.network.onNavigated.removeListener(handleNavigation);
    panel.onShown.removeListener(handlePanelShown); // Run once only
    chrome.devtools.network.onRequestFinished.removeListener(handleRequest);

    panelWindow.dispatchEvent(new CustomEvent('INITIAL_REQUESTS_DATA', {
      detail: httpArchiveRequests
    }));
  });
}

panels.create('JSON-RPC Chrome Viewer', 'icons/16.png', 'application.html', callback);

