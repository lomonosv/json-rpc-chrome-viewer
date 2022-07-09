import React, { createContext, useContext, useEffect, useState } from 'react';
import { Theme, JsonViewerTheme } from './Theme';
import { getConfig } from './helpers';

const defaultPreserveLogValue = false;
const defaultShowRequestUrlValue = true;
const defaultShowCorsBadgeValue = true;

const isDevtoolsDarkTheme = (): boolean => (
  chrome.devtools.panels.themeName === Theme.Dark
);

const getJsonViewerTheme = (): JsonViewerTheme => (
  isDevtoolsDarkTheme() ? JsonViewerTheme.Dark : JsonViewerTheme.Light
);

const useSettings = () => {
  const [preserveLog, setPreserveLog] = useState<boolean>(defaultPreserveLogValue);
  const [showRequestUrl, setShowRequestUrl] = useState<boolean>(defaultShowRequestUrlValue);
  const [showCorsBadge, setShowCorsBadge] = useState<boolean>(defaultShowCorsBadgeValue);
  const [jsonViewerTheme, setJsonViewerTheme] = useState<JsonViewerTheme>(getJsonViewerTheme());

  useEffect(() => {
    getConfig('settings_preserveLog', defaultPreserveLogValue).then(setPreserveLog);
    getConfig('settings_showRequestUrl', defaultShowRequestUrlValue).then(setShowRequestUrl);
    getConfig('settings_showCorsBadge', defaultShowCorsBadgeValue).then(setShowCorsBadge);
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

  return {
    preserveLog,
    showRequestUrl,
    showCorsBadge,
    jsonViewerTheme,
    isDarkTheme: isDevtoolsDarkTheme(),
    setPreserveLog: handlePreserveLogChange,
    setShowRequestUrl: handleShowRequestUrlChange,
    setShowCorsBadge: handleShowCorsBadgeChange,
    setJsonViewerTheme
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
