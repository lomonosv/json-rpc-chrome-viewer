const panels = chrome && chrome.devtools && chrome.devtools.panels;

// TODO: Add images for extension and update path here and in manifest.json file
panels.create('JSON-RPC Chrome Viewer', 'images/get_started16.png', 'application.html');
