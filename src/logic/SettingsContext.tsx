import React, { createContext, useContext, useState } from 'react';
import { Theme, JsonViewerTheme } from './Theme';

const isDevtoolsDarkTheme = (): boolean => (
  chrome.devtools.panels.themeName === Theme.Dark
);

const getJsonViewerTheme = (): JsonViewerTheme => (
  isDevtoolsDarkTheme() ? JsonViewerTheme.Dark : JsonViewerTheme.Light
);

const useSettings = () => {
  const [preserveLog, setPreserveLog] = useState<boolean>(true);
  const [showRequestUrl, setShowRequestUrl] = useState<boolean>(true);
  const [showCorsBadge, setShowCorsBadge] = useState<boolean>(true);
  const [jsonViewerTheme, setJsonViewerTheme] = useState<JsonViewerTheme>(getJsonViewerTheme());

  return {
    preserveLog,
    showRequestUrl,
    showCorsBadge,
    jsonViewerTheme,
    isDarkTheme: isDevtoolsDarkTheme(),
    setPreserveLog,
    setShowRequestUrl,
    setShowCorsBadge,
    setJsonViewerTheme
  };
};

type SettingsContextType = ReturnType<typeof useSettings>;

export const SettingsContext = createContext<SettingsContextType>(null);

export const useSettingsContext = (): SettingsContextType => (
  useContext<SettingsContextType>(SettingsContext)
);

interface IProps {
  children: React.ReactElement
}

const SettingsContextProvider: React.FC<IProps> = ({ children }) => (
  <SettingsContext.Provider value={ useSettings() }>
    { children }
  </SettingsContext.Provider>
);

export default SettingsContextProvider;
