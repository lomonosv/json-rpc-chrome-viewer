import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { v4 as uuid } from 'uuid';
import { getConfig } from '~/logic/common/helpers';
import { useSettingsContext } from '~/logic/SettingsContext/SettingsContext';
import { interceptorPortName } from '~/logic/common/messages';
import { IInterceptorRule } from '~/logic/Interceptor/IInterceptorRule';
import { IRequest } from '~/logic/HTTPArchive/IRequest';
import {
  createRule,
  createRuleFromRequest,
  enabledStorageKey,
  normaliseRules,
  rulesStorageKey
} from '~/logic/Interceptor/rules';

const defaultRules: IInterceptorRule[] = [];
const defaultIsEnabled = false;

const useInterceptor = () => {
  const [rules, setRules] = useState<IInterceptorRule[]>(defaultRules);
  const [isEnabled, setIsEnabled] = useState<boolean>(defaultIsEnabled);
  const [isInterceptorVisible, setIsInterceptorVisible] = useState<boolean>(false);
  const { resilientCapture } = useSettingsContext();

  useEffect(() => {
    getConfig(rulesStorageKey, defaultRules).then((stored) => {
      setRules(normaliseRules(stored));
    });
    getConfig(enabledStorageKey, defaultIsEnabled).then((stored) => {
      setIsEnabled(!!stored);
    });
  }, []);

  const portRef = useRef<chrome.runtime.Port>(null);

  useEffect(() => {
    let isUnmounted = false;

    const connect = () => {
      if (isUnmounted) {
        return;
      }

      const port = chrome.runtime.connect({ name: interceptorPortName });

      portRef.current = port;
      port.postMessage({ tabId: chrome.devtools.inspectedWindow.tabId });
      port.onDisconnect.addListener(connect);
    };

    connect();

    return () => {
      isUnmounted = true;
      portRef.current?.disconnect();
      portRef.current = null;
    };
  }, []);

  const pingPort = () => {
    portRef.current?.postMessage({ tabId: chrome.devtools.inspectedWindow.tabId });
  };

  const persistRules = (rules: IInterceptorRule[]) => {
    setRules(rules);
    chrome.storage.local.set({ [rulesStorageKey]: rules }).then(pingPort);
  };

  const updateIsEnabled = (isEnabled: boolean) => {
    setIsEnabled(isEnabled);
    chrome.storage.local.set({ [enabledStorageKey]: isEnabled }).then(pingPort);
  };

  const isFirstResilientCaptureRun = useRef<boolean>(true);

  useEffect(() => {
    if (isFirstResilientCaptureRun.current) {
      isFirstResilientCaptureRun.current = false;

      return;
    }

    pingPort();
  }, [resilientCapture]);

  const addRule = () => {
    persistRules([...rules, createRule(uuid())]);
  };

  const addRuleFromRequest = (item: IRequest) => {
    persistRules([...rules, createRuleFromRequest(uuid(), item)]);
    setIsInterceptorVisible(true);
  };

  const showInterceptor = () => {
    setIsInterceptorVisible(true);
  };

  const hideInterceptor = () => {
    setIsInterceptorVisible(false);
  };

  const updateRule = (id: string, patch: Partial<IInterceptorRule>) => {
    persistRules(rules.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule)));
  };

  const removeRule = (id: string) => {
    persistRules(rules.filter((rule) => rule.id !== id));
  };

  return {
    rules,
    isEnabled,
    activeRulesCount: rules.filter((rule) => rule.isEnabled).length,
    setIsEnabled: updateIsEnabled,
    addRule,
    addRuleFromRequest,
    updateRule,
    removeRule,
    isInterceptorVisible,
    showInterceptor,
    hideInterceptor
  };
};

type InterceptorContextType = ReturnType<typeof useInterceptor>;

export const InterceptorContext = createContext<InterceptorContextType>(null);

export const useInterceptorContext = (): InterceptorContextType => (
  useContext<InterceptorContextType>(InterceptorContext)
);

interface IComponentProps {
  children: React.ReactElement,
}

const InterceptorContextProvider: React.FC<IComponentProps> = ({ children }) => (
  <InterceptorContext.Provider value={ useInterceptor() }>
    { children }
  </InterceptorContext.Provider>
);

export default InterceptorContextProvider;
