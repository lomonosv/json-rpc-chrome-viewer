import React, { createContext, useContext, useEffect, useState } from 'react';
import { DevToolsTheme, ExtensionTheme, JsonViewerTheme } from '~/logic/SettingsContext/Theme';
import { ExpandTreeState } from '~/components/common/JsonViewer/ExpandTreeState';
import { getConfig } from '~/logic/common/helpers';

const defaultPreserveLogValue = false;
const defaultIncludeJsonRpcLogsValue = true;
const defaultIncludeWebsocketLogsValue = false;
const defaultShowRequestUrlValue = true;
const defaultShowCorsBadgeValue = true;
const defaultShowWebsocketBadgeValue = true;
const defaultExtensionThemeValue = ExtensionTheme.System;
const defaultExpandTreeStateValue = ExpandTreeState.Default;
const defaultExpandedWebsocketMessagesStateValue = ExpandTreeState.Default;
const defaultJsonViewerThemeValue = JsonViewerTheme.System;
const defaultAutoScrollValue = true;

const useSettings = () => {
  const [isDevtoolsDarkTheme, setIsDevtoolsDarkTheme] = useState<boolean>(
    chrome.devtools.panels.themeName === DevToolsTheme.Dark,
  );
  const [preserveLog, setPreserveLog] = useState<boolean>(defaultPreserveLogValue);
  const [includeJsonRpcLogs, setIncludeJsonRpcLogs] = useState<boolean>(defaultIncludeJsonRpcLogsValue);
  const [includeWebsocketLogs, setIncludeWebsocketLogs] = useState<boolean>(defaultIncludeWebsocketLogsValue);
  const [showRequestUrl, setShowRequestUrl] = useState<boolean>(defaultShowRequestUrlValue);
  const [showCorsBadge, setShowCorsBadge] = useState<boolean>(defaultShowCorsBadgeValue);
  const [showWebsocketBadge, setShowWebsocketBadge] = useState<boolean>(defaultShowWebsocketBadgeValue);
  const [expandTreeState, setExpandTreeState] = useState<ExpandTreeState>(defaultExpandTreeStateValue);
  const [expandedWebsocketMessagesState, setExpandedWebsocketMessagesState] = useState<ExpandTreeState>(
    defaultExpandedWebsocketMessagesStateValue
  );
  const [extensionTheme, setExtensionTheme] = useState<ExtensionTheme>(defaultExtensionThemeValue);
  const [jsonViewerTheme, setJsonViewerTheme] = useState<JsonViewerTheme>(defaultJsonViewerThemeValue);
  const [autoScroll, setAutoScroll] = useState<boolean>(defaultAutoScrollValue);

  useEffect(() => {
    // It is available actually in API.
    // @ts-ignore
    chrome.devtools.panels.setThemeChangeHandler?.(() => {
      setIsDevtoolsDarkTheme(chrome.devtools.panels.themeName === DevToolsTheme.Dark);
    });
  }, []);

  useEffect(() => {
    getConfig('settings_preserveLog', defaultPreserveLogValue).then(setPreserveLog);
    getConfig('settings_includeJsonRpcLogs', defaultIncludeJsonRpcLogsValue).then(setIncludeJsonRpcLogs);
    getConfig('settings_includeWebsocketLogs', defaultIncludeWebsocketLogsValue).then(setIncludeWebsocketLogs);
    getConfig('settings_showRequestUrl', defaultShowRequestUrlValue).then(setShowRequestUrl);
    getConfig('settings_showCorsBadge', defaultShowCorsBadgeValue).then(setShowCorsBadge);
    getConfig('settings_showWebsocketBadge', defaultShowWebsocketBadgeValue).then(setShowWebsocketBadge);
    getConfig('settings_expandTreeState', defaultExpandTreeStateValue).then(setExpandTreeState);
    getConfig('settings_expandedWebsocketMessagesState', defaultExpandedWebsocketMessagesStateValue)
      .then(setExpandedWebsocketMessagesState);
    getConfig('settings_extensionTheme', defaultExtensionThemeValue).then(setExtensionTheme);
    getConfig('settings_jsonViewerTheme', defaultJsonViewerThemeValue).then(setJsonViewerTheme);
    getConfig('settings_autoScroll', defaultAutoScrollValue).then(setAutoScroll);
  }, []);

  const handlePreserveLogChange = (settings_preserveLog: boolean) => {
    setPreserveLog(settings_preserveLog);
    chrome.storage.local.set({ settings_preserveLog });
  };

  const handleIncludeJsonRpcLogsChange = (settings_includeJsonRpcLogs: boolean) => {
    setIncludeJsonRpcLogs(settings_includeJsonRpcLogs);
    chrome.storage.local.set({ settings_includeJsonRpcLogs });
  };

  const handleIncludeWebsocketLogsChange = (settings_includeWebsocketLogs: boolean) => {
    setIncludeWebsocketLogs(settings_includeWebsocketLogs);
    chrome.storage.local.set({ settings_includeWebsocketLogs });
  };

  const handleShowRequestUrlChange = (settings_showRequestUrl: boolean) => {
    setShowRequestUrl(settings_showRequestUrl);
    chrome.storage.local.set({ settings_showRequestUrl });
  };

  const handleShowCorsBadgeChange = (settings_showCorsBadge: boolean) => {
    setShowCorsBadge(settings_showCorsBadge);
    chrome.storage.local.set({ settings_showCorsBadge });
  };

  const handleShowWebsocketBadgeChange = (settings_showWebsocketBadge: boolean) => {
    setShowWebsocketBadge(settings_showWebsocketBadge);
    chrome.storage.local.set({ settings_showWebsocketBadge });
  };

  const handleExpandTreeStateChange = (settings_expandTreeState: ExpandTreeState) => {
    setExpandTreeState(settings_expandTreeState);
    chrome.storage.local.set({ settings_expandTreeState });
  };

  const handleExpandedWebsocketMessagesStateChange = (settings_expandedWebsocketMessagesState: ExpandTreeState) => {
    setExpandedWebsocketMessagesState(settings_expandedWebsocketMessagesState);
    chrome.storage.local.set({ settings_expandedWebsocketMessagesState });
  };

  const handleJsonViewerThemeChange = (settings_jsonViewerTheme: JsonViewerTheme) => {
    setJsonViewerTheme(settings_jsonViewerTheme);
    chrome.storage.local.set({ settings_jsonViewerTheme });
  };

  const handleExtensionThemeChange = (settings_extensionTheme: ExtensionTheme) => {
    setExtensionTheme(settings_extensionTheme);
    chrome.storage.local.set({ settings_extensionTheme });
  };

  const getSystemJsonViewerTheme = (): JsonViewerTheme => (
    isDevtoolsDarkTheme ? JsonViewerTheme.SummerFruit : JsonViewerTheme.SummerFruitInverted
  );

  const handleAutoScrollChange = (settings_autoScroll: boolean) => {
    setAutoScroll(settings_autoScroll);
    chrome.storage.local.set({ settings_autoScroll });
  };

  return {
    preserveLog,
    includeJsonRpcLogs,
    includeWebsocketLogs,
    expandedWebsocketMessagesState,
    showRequestUrl,
    showCorsBadge,
    showWebsocketBadge,
    expandTreeState,
    extensionTheme,
    jsonViewerTheme,
    autoScroll,
    systemJsonViewerTheme: jsonViewerTheme === JsonViewerTheme.System ? getSystemJsonViewerTheme() : jsonViewerTheme,
    isDarkTheme: (isDevtoolsDarkTheme && extensionTheme === ExtensionTheme.System)
      || extensionTheme === ExtensionTheme.Dark,
    setPreserveLog: handlePreserveLogChange,
    setIncludeJsonRpcLogs: handleIncludeJsonRpcLogsChange,
    setIncludeWebsocketLogs: handleIncludeWebsocketLogsChange,
    setExpandedWebsocketMessagesState: handleExpandedWebsocketMessagesStateChange,
    setShowRequestUrl: handleShowRequestUrlChange,
    setShowCorsBadge: handleShowCorsBadgeChange,
    setShowWebsocketBadge: handleShowWebsocketBadgeChange,
    setExpandTreeState: handleExpandTreeStateChange,
    setExtensionTheme: handleExtensionThemeChange,
    setJsonViewerTheme: handleJsonViewerThemeChange,
    setAutoScroll: handleAutoScrollChange
  };
};

type SettingsContextType = ReturnType<typeof useSettings>;

export const SettingsContext = createContext<SettingsContextType>(null);

export const useSettingsContext = (): SettingsContextType => (
  useContext<SettingsContextType>(SettingsContext)
);

interface IComponentProps {
  children: React.ReactElement
}

const SettingsContextProvider: React.FC<IComponentProps> = ({ children }) => (
  <SettingsContext.Provider value={ useSettings() }>
    { children }
  </SettingsContext.Provider>
);

export default SettingsContextProvider;
