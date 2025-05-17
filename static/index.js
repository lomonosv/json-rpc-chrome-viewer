const panels = chrome && chrome.devtools && chrome.devtools.panels;
const httpArchiveRequests = [];

const callback = (panel) => {
  const handleRequest = (httpArchiveRequest) => {
    httpArchiveRequest.getContent((responseContent) => {
      httpArchiveRequests.push({
        request: httpArchiveRequest,
        responseContent
      });
    });
  };

  const handleNavigation = () => {
    chrome.storage.local.get(['settings_preserveLog'], (result) => {
      !result.settings_preserveLog && httpArchiveRequests.splice(0);
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

