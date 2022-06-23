const panels = chrome && chrome.devtools && chrome.devtools.panels;

const callback = (panel) => {
  const httpArchiveRequests = [];
  const handleRequest = (httpArchiveRequest) => {
    httpArchiveRequests.push(httpArchiveRequest);
  };

  chrome.devtools.network.onRequestFinished.addListener(handleRequest);

  panel.onShown.addListener(function handlePanelShown(panelWindow) {
    panel.onShown.removeListener(handlePanelShown); // Run once only
    chrome.devtools.network.onRequestFinished.removeListener(handleRequest);
    panelWindow.INITIAL_REQUESTS_DATA = httpArchiveRequests;
    panelWindow.dispatchEvent(new Event('INITIAL_REQUESTS_DATA'));
  });
}

// TODO: Add images for extension and update path here and in manifest.json file
panels.create('JSON-RPC Chrome Viewer', 'images/get_started16.png', 'application.html', callback);
