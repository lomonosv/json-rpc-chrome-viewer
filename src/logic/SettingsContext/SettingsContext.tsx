import React, { createContext, useContext, useEffect, useState } from 'react';
import { DevToolsTheme, ExtensionTheme, JsonViewerTheme } from '~/logic/SettingsContext/Theme';
import { ViewMode } from '~/logic/SettingsContext/ViewMode';
import { ExpandTreeState } from '~/components/common/JsonViewer/ExpandTreeState';
import { expandAllLevels } from '~/components/common/JsonViewer/ExpandLevel';
import { SearchScope } from '~/logic/HTTPArchive/SearchScope';
import { getConfig, setConfig } from '~/logic/common/helpers';

const defaultPreserveLogValue = false;
const defaultIncludeJsonRpcLogsValue = true;
const defaultIncludeWebsocketLogsValue = false;
const defaultSearchScopeValue = SearchScope.Method;
const defaultCaseSensitiveSearchValue = false;
const defaultShowRequestUrlValue = true;
const defaultShowCorsBadgeValue = true;
const defaultShowWebsocketBadgeValue = true;
const defaultExtensionThemeValue = ExtensionTheme.System;
const defaultExpandTreeStateValue = ExpandTreeState.Default;
const defaultExpandLevelValue = expandAllLevels;
const defaultExpandedWebsocketMessagesStateValue = ExpandTreeState.Default;
const defaultShowCollapsedPreviewValue = true;
const defaultJsonViewerThemeValue = JsonViewerTheme.System;
const defaultAutoScrollValue = true;
const defaultShowWaterfallColumnValue = true;
const defaultShowStatusColumnValue = true;
const defaultShowSizeColumnValue = true;
const defaultShowTimeColumnValue = true;
const defaultViewModeValue = ViewMode.Panes;
const defaultResilientCaptureValue = true;

const useSettings = () => {
  const [isDevtoolsDarkTheme, setIsDevtoolsDarkTheme] = useState<boolean>(
    chrome.devtools.panels.themeName === DevToolsTheme.Dark,
  );
  const [preserveLog, setPreserveLog] = useState<boolean>(defaultPreserveLogValue);
  const [includeJsonRpcLogs, setIncludeJsonRpcLogs] = useState<boolean>(defaultIncludeJsonRpcLogsValue);
  const [includeWebsocketLogs, setIncludeWebsocketLogs] = useState<boolean>(defaultIncludeWebsocketLogsValue);
  const [searchScope, setSearchScope] = useState<SearchScope>(defaultSearchScopeValue);
  const [caseSensitiveSearch, setCaseSensitiveSearch] = useState<boolean>(defaultCaseSensitiveSearchValue);
  const [showRequestUrl, setShowRequestUrl] = useState<boolean>(defaultShowRequestUrlValue);
  const [showCorsBadge, setShowCorsBadge] = useState<boolean>(defaultShowCorsBadgeValue);
  const [showWebsocketBadge, setShowWebsocketBadge] = useState<boolean>(defaultShowWebsocketBadgeValue);
  const [expandTreeState, setExpandTreeState] = useState<ExpandTreeState>(defaultExpandTreeStateValue);
  const [expandLevel, setExpandLevel] = useState<number>(defaultExpandLevelValue);
  const [expandedWebsocketMessagesState, setExpandedWebsocketMessagesState] = useState<ExpandTreeState>(
    defaultExpandedWebsocketMessagesStateValue
  );
  const [showCollapsedPreview, setShowCollapsedPreview] = useState<boolean>(defaultShowCollapsedPreviewValue);
  const [extensionTheme, setExtensionTheme] = useState<ExtensionTheme>(defaultExtensionThemeValue);
  const [jsonViewerTheme, setJsonViewerTheme] = useState<JsonViewerTheme>(defaultJsonViewerThemeValue);
  const [autoScroll, setAutoScroll] = useState<boolean>(defaultAutoScrollValue);
  const [showWaterfallColumn, setShowWaterfallColumn] = useState<boolean>(defaultShowWaterfallColumnValue);
  const [showStatusColumn, setShowStatusColumn] = useState<boolean>(defaultShowStatusColumnValue);
  const [showSizeColumn, setShowSizeColumn] = useState<boolean>(defaultShowSizeColumnValue);
  const [showTimeColumn, setShowTimeColumn] = useState<boolean>(defaultShowTimeColumnValue);
  const [viewMode, setViewMode] = useState<ViewMode>(defaultViewModeValue);
  const [resilientCapture, setResilientCapture] = useState<boolean>(defaultResilientCaptureValue);

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
    getConfig('settings_searchScope', defaultSearchScopeValue).then(setSearchScope);
    getConfig('settings_caseSensitiveSearch', defaultCaseSensitiveSearchValue).then(setCaseSensitiveSearch);
    getConfig('settings_showRequestUrl', defaultShowRequestUrlValue).then(setShowRequestUrl);
    getConfig('settings_showCorsBadge', defaultShowCorsBadgeValue).then(setShowCorsBadge);
    getConfig('settings_showWebsocketBadge', defaultShowWebsocketBadgeValue).then(setShowWebsocketBadge);
    getConfig('settings_expandTreeState', defaultExpandTreeStateValue).then(setExpandTreeState);
    getConfig('settings_expandLevel', defaultExpandLevelValue).then(setExpandLevel);
    getConfig('settings_showCollapsedPreview', defaultShowCollapsedPreviewValue).then(setShowCollapsedPreview);
    getConfig('settings_expandedWebsocketMessagesState', defaultExpandedWebsocketMessagesStateValue)
      .then(setExpandedWebsocketMessagesState);
    getConfig('settings_extensionTheme', defaultExtensionThemeValue).then(setExtensionTheme);
    getConfig('settings_jsonViewerTheme', defaultJsonViewerThemeValue).then(setJsonViewerTheme);
    getConfig('settings_autoScroll', defaultAutoScrollValue).then(setAutoScroll);
    getConfig('settings_showWaterfallColumn', defaultShowWaterfallColumnValue).then(setShowWaterfallColumn);
    getConfig('settings_showStatusColumn', defaultShowStatusColumnValue).then(setShowStatusColumn);
    getConfig('settings_showSizeColumn', defaultShowSizeColumnValue).then(setShowSizeColumn);
    getConfig('settings_showTimeColumn', defaultShowTimeColumnValue).then(setShowTimeColumn);
    getConfig('settings_viewMode', defaultViewModeValue).then(setViewMode);
    getConfig('settings_resilientCapture', defaultResilientCaptureValue).then(setResilientCapture);
  }, []);

  const handlePreserveLogChange = (settings_preserveLog: boolean) => {
    setPreserveLog(settings_preserveLog);
    setConfig({ settings_preserveLog });
  };

  const handleIncludeJsonRpcLogsChange = (settings_includeJsonRpcLogs: boolean) => {
    setIncludeJsonRpcLogs(settings_includeJsonRpcLogs);
    setConfig({ settings_includeJsonRpcLogs });
  };

  const handleIncludeWebsocketLogsChange = (settings_includeWebsocketLogs: boolean) => {
    setIncludeWebsocketLogs(settings_includeWebsocketLogs);
    setConfig({ settings_includeWebsocketLogs });
  };

  const handleSearchScopeChange = (settings_searchScope: SearchScope) => {
    setSearchScope(settings_searchScope);
    setConfig({ settings_searchScope });
  };

  const handleCaseSensitiveSearchChange = (settings_caseSensitiveSearch: boolean) => {
    setCaseSensitiveSearch(settings_caseSensitiveSearch);
    setConfig({ settings_caseSensitiveSearch });
  };

  const handleShowRequestUrlChange = (settings_showRequestUrl: boolean) => {
    setShowRequestUrl(settings_showRequestUrl);
    setConfig({ settings_showRequestUrl });
  };

  const handleShowCorsBadgeChange = (settings_showCorsBadge: boolean) => {
    setShowCorsBadge(settings_showCorsBadge);
    setConfig({ settings_showCorsBadge });
  };

  const handleShowWebsocketBadgeChange = (settings_showWebsocketBadge: boolean) => {
    setShowWebsocketBadge(settings_showWebsocketBadge);
    setConfig({ settings_showWebsocketBadge });
  };

  const handleExpandTreeStateChange = (settings_expandTreeState: ExpandTreeState) => {
    setExpandTreeState(settings_expandTreeState);
    setConfig({ settings_expandTreeState });
  };

  const handleExpandLevelChange = (settings_expandLevel: number) => {
    setExpandLevel(settings_expandLevel);
    setConfig({ settings_expandLevel });
  };

  const handleShowCollapsedPreviewChange = (settings_showCollapsedPreview: boolean) => {
    setShowCollapsedPreview(settings_showCollapsedPreview);
    setConfig({ settings_showCollapsedPreview });
  };

  const handleExpandedWebsocketMessagesStateChange = (settings_expandedWebsocketMessagesState: ExpandTreeState) => {
    setExpandedWebsocketMessagesState(settings_expandedWebsocketMessagesState);
    setConfig({ settings_expandedWebsocketMessagesState });
  };

  const handleJsonViewerThemeChange = (settings_jsonViewerTheme: JsonViewerTheme) => {
    setJsonViewerTheme(settings_jsonViewerTheme);
    setConfig({ settings_jsonViewerTheme });
  };

  const handleExtensionThemeChange = (settings_extensionTheme: ExtensionTheme) => {
    setExtensionTheme(settings_extensionTheme);
    setConfig({ settings_extensionTheme });
  };

  const getSystemJsonViewerTheme = (): JsonViewerTheme => (
    isDevtoolsDarkTheme ? JsonViewerTheme.SummerFruit : JsonViewerTheme.SummerFruitInverted
  );

  const handleAutoScrollChange = (settings_autoScroll: boolean) => {
    setAutoScroll(settings_autoScroll);
    setConfig({ settings_autoScroll });
  };

  const handleShowWaterfallColumnChange = (settings_showWaterfallColumn: boolean) => {
    setShowWaterfallColumn(settings_showWaterfallColumn);
    setConfig({ settings_showWaterfallColumn });
  };

  const handleShowStatusColumnChange = (settings_showStatusColumn: boolean) => {
    setShowStatusColumn(settings_showStatusColumn);
    setConfig({ settings_showStatusColumn });
  };

  const handleShowSizeColumnChange = (settings_showSizeColumn: boolean) => {
    setShowSizeColumn(settings_showSizeColumn);
    setConfig({ settings_showSizeColumn });
  };

  const handleShowTimeColumnChange = (settings_showTimeColumn: boolean) => {
    setShowTimeColumn(settings_showTimeColumn);
    setConfig({ settings_showTimeColumn });
  };

  const handleViewModeChange = (settings_viewMode: ViewMode) => {
    setViewMode(settings_viewMode);
    setConfig({ settings_viewMode });
  };

  const handleResilientCaptureChange = (settings_resilientCapture: boolean) => {
    setResilientCapture(settings_resilientCapture);
    setConfig({ settings_resilientCapture });
  };

  return {
    preserveLog,
    includeJsonRpcLogs,
    includeWebsocketLogs,
    searchScope,
    caseSensitiveSearch,
    expandedWebsocketMessagesState,
    showRequestUrl,
    showCorsBadge,
    showWebsocketBadge,
    expandTreeState,
    expandLevel,
    showCollapsedPreview,
    extensionTheme,
    jsonViewerTheme,
    autoScroll,
    showWaterfallColumn,
    showStatusColumn,
    showSizeColumn,
    showTimeColumn,
    viewMode,
    resilientCapture,
    systemJsonViewerTheme: jsonViewerTheme === JsonViewerTheme.System ? getSystemJsonViewerTheme() : jsonViewerTheme,
    isDarkTheme: (isDevtoolsDarkTheme && extensionTheme === ExtensionTheme.System)
      || extensionTheme === ExtensionTheme.Dark,
    setPreserveLog: handlePreserveLogChange,
    setIncludeJsonRpcLogs: handleIncludeJsonRpcLogsChange,
    setIncludeWebsocketLogs: handleIncludeWebsocketLogsChange,
    setSearchScope: handleSearchScopeChange,
    setCaseSensitiveSearch: handleCaseSensitiveSearchChange,
    setExpandedWebsocketMessagesState: handleExpandedWebsocketMessagesStateChange,
    setShowRequestUrl: handleShowRequestUrlChange,
    setShowCorsBadge: handleShowCorsBadgeChange,
    setShowWebsocketBadge: handleShowWebsocketBadgeChange,
    setExpandTreeState: handleExpandTreeStateChange,
    setExpandLevel: handleExpandLevelChange,
    setShowCollapsedPreview: handleShowCollapsedPreviewChange,
    setExtensionTheme: handleExtensionThemeChange,
    setJsonViewerTheme: handleJsonViewerThemeChange,
    setAutoScroll: handleAutoScrollChange,
    setShowWaterfallColumn: handleShowWaterfallColumnChange,
    setShowStatusColumn: handleShowStatusColumnChange,
    setShowSizeColumn: handleShowSizeColumnChange,
    setShowTimeColumn: handleShowTimeColumnChange,
    setViewMode: handleViewModeChange,
    setResilientCapture: handleResilientCaptureChange
  };
};

type SettingsContextType = ReturnType<typeof useSettings>;

export const SettingsContext = createContext<SettingsContextType>(null);

export const useSettingsContext = (): SettingsContextType => (
  useContext<SettingsContextType>(SettingsContext)
);

interface IComponentProps {
  children: React.ReactElement,
}

const SettingsContextProvider: React.FC<IComponentProps> = ({ children }) => (
  <SettingsContext.Provider value={ useSettings() }>
    { children }
  </SettingsContext.Provider>
);

export default SettingsContextProvider;
