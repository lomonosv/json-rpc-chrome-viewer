import React, { createContext, useContext, useEffect, useState } from 'react';
import { JsonViewerTheme, DevToolsTheme } from '~/logic/SettingsContext/Theme';
import { ExpandTreeState } from '~/components/common/JsonViewer/ExpandTreeState';
import { getConfig } from '~/logic/common/helpers';

const defaultPreserveLogValue = false;
const defaultShowRequestUrlValue = true;
const defaultShowCorsBadgeValue = true;
const defaultExpandTreeStateValue = ExpandTreeState.Default;
const defaultJsonViewerThemeValue = JsonViewerTheme.System;

const isDevtoolsDarkTheme = (): boolean => (
  chrome.devtools.panels.themeName === DevToolsTheme.Dark
);

const useSettings = () => {
  const [preserveLog, setPreserveLog] = useState<boolean>(defaultPreserveLogValue);
  const [showRequestUrl, setShowRequestUrl] = useState<boolean>(defaultShowRequestUrlValue);
  const [showCorsBadge, setShowCorsBadge] = useState<boolean>(defaultShowCorsBadgeValue);
  const [expandTreeState, setExpandTreeState] = useState<ExpandTreeState>(defaultExpandTreeStateValue);
  const [jsonViewerTheme, setJsonViewerTheme] = useState<JsonViewerTheme>(defaultJsonViewerThemeValue);

  useEffect(() => {
    getConfig('settings_preserveLog', defaultPreserveLogValue).then(setPreserveLog);
    getConfig('settings_showRequestUrl', defaultShowRequestUrlValue).then(setShowRequestUrl);
    getConfig('settings_showCorsBadge', defaultShowCorsBadgeValue).then(setShowCorsBadge);
    getConfig('settings_expandTreeState', defaultExpandTreeStateValue).then(setExpandTreeState);
    getConfig('settings_jsonViewerTheme', defaultJsonViewerThemeValue).then(setJsonViewerTheme);
  }, []);

  const handlePreserveLogChange = (settings_preserveLog: boolean) => {
    setPreserveLog(settings_preserveLog);
    chrome.storage.local.set({ settings_preserveLog });
  };

  const handleShowRequestUrlChange = (settings_showRequestUrl: boolean) => {
    setShowRequestUrl(settings_showRequestUrl);
    chrome.storage.local.set({ settings_showRequestUrl });
  };

  const handleShowCorsBadgeChange = (settings_showCorsBadge: boolean) => {
    setShowCorsBadge(settings_showCorsBadge);
    chrome.storage.local.set({ settings_showCorsBadge });
  };

  const handleExpandTreeStateChange = (settings_expandTreeState: ExpandTreeState) => {
    setExpandTreeState(settings_expandTreeState);
    chrome.storage.local.set({ settings_expandTreeState });
  };

  const handleJsonViewerThemeChange = (settings_jsonViewerTheme: JsonViewerTheme) => {
    setJsonViewerTheme(settings_jsonViewerTheme);
    chrome.storage.local.set({ settings_jsonViewerTheme });
  };

  const getSystemJsonViewerTheme = (): JsonViewerTheme => (
    isDevtoolsDarkTheme() ? JsonViewerTheme.SummerFruit : JsonViewerTheme.SummerFruitInverted
  );

  return {
    preserveLog,
    showRequestUrl,
    showCorsBadge,
    expandTreeState,
    jsonViewerTheme,
    systemJsonViewerTheme: jsonViewerTheme === JsonViewerTheme.System ? getSystemJsonViewerTheme() : jsonViewerTheme,
    isDarkTheme: isDevtoolsDarkTheme(),
    setPreserveLog: handlePreserveLogChange,
    setShowRequestUrl: handleShowRequestUrlChange,
    setShowCorsBadge: handleShowCorsBadgeChange,
    setExpandTreeState: handleExpandTreeStateChange,
    setJsonViewerTheme: handleJsonViewerThemeChange
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
