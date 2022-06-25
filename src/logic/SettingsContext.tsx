import React, { createContext, useContext, useState } from 'react';

const isDevtoolsDarkTheme = (): boolean => (
  chrome.devtools.panels.themeName === 'dark'
);

const getJsonViewerTheme = (): string => (
  isDevtoolsDarkTheme() ? 'summerfruit' : 'summerfruit:inverted'
);

const useSettings = () => {
  const [preserveLog, setPreserveLog] = useState<boolean>(true);

  const save = ({
    preserveLog
  }: {
    preserveLog: boolean
  }) => {
    setPreserveLog(preserveLog);
  };

  return {
    preserveLog,
    isDarkTheme: isDevtoolsDarkTheme(),
    jsonViewerTheme: getJsonViewerTheme(),
    save
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
