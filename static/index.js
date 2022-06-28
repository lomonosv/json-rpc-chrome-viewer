const panels = chrome && chrome.devtools && chrome.devtools.panels;

const callback = (panel) => {
  let httpArchiveRequests = [];

  const handleRequest = (httpArchiveRequest) => {
    httpArchiveRequests.push(httpArchiveRequest);
  };

  chrome.devtools.network.onRequestFinished.addListener(handleRequest);

  panel.onShown.addListener(function handlePanelShown(panelWindow) {
    panel.onShown.removeListener(handlePanelShown); // Run once only
    chrome.devtools.network.onRequestFinished.removeListener(handleRequest);

    panelWindow.dispatchEvent(new CustomEvent('INITIAL_REQUESTS_DATA', {
      detail: httpArchiveRequests
    }));
  });
}

// TODO: Add images for extension and update path here and in manifest.json file
panels.create('JSON-RPC Chrome Viewer', './images/16.png', 'application.html', callback);
