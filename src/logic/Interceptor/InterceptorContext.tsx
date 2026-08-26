import React, { createContext, useContext, useEffect, useState } from 'react';
import { v4 as uuid } from 'uuid';
import { getConfig } from '~/logic/common/helpers';
import { interceptorPortName } from '~/logic/common/messages';
import { IInterceptorRule } from '~/logic/Interceptor/IInterceptorRule';
import {
  createRule,
  enabledStorageKey,
  normaliseRules,
  rulesStorageKey
} from '~/logic/Interceptor/rules';

const defaultRules: IInterceptorRule[] = [];
const defaultIsEnabled = false;

const useInterceptor = () => {
  const [rules, setRules] = useState<IInterceptorRule[]>(defaultRules);
  const [isEnabled, setIsEnabled] = useState<boolean>(defaultIsEnabled);

  useEffect(() => {
    getConfig(rulesStorageKey, defaultRules).then((stored) => {
      setRules(normaliseRules(stored));
    });
    getConfig(enabledStorageKey, defaultIsEnabled).then((stored) => {
      setIsEnabled(!!stored);
    });
  }, []);

  useEffect(() => {
    let port: chrome.runtime.Port = null;
    let isUnmounted = false;

    const connect = () => {
      if (isUnmounted) {
        return;
      }

      port = chrome.runtime.connect({ name: interceptorPortName });
      port.postMessage({ tabId: chrome.devtools.inspectedWindow.tabId });
      port.onDisconnect.addListener(connect);
    };

    connect();

    return () => {
      isUnmounted = true;
      port?.onDisconnect.removeListener(connect);
      port?.disconnect();
    };
  }, []);

  const persistRules = (rules: IInterceptorRule[]) => {
    setRules(rules);
    chrome.storage.local.set({ [rulesStorageKey]: rules });
  };

  const updateIsEnabled = (isEnabled: boolean) => {
    setIsEnabled(isEnabled);
    chrome.storage.local.set({ [enabledStorageKey]: isEnabled });
  };

  const addRule = () => {
    persistRules([...rules, createRule(uuid())]);
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
    updateRule,
    removeRule
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
