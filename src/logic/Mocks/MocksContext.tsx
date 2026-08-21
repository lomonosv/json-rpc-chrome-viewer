import React, { createContext, useContext, useEffect, useState } from 'react';
import { v4 as uuid } from 'uuid';
import { getConfig } from '~/logic/common/helpers';
import { IMockRule, MockResponseType } from '~/logic/Mocks/IMockRule';

const defaultRules: IMockRule[] = [];
const defaultMocksEnabled = false;

export const createMockRule = (): IMockRule => ({
  id: uuid(),
  enabled: true,
  method: '',
  urlPattern: '',
  responseType: MockResponseType.Result,
  body: '{}',
  status: 200,
  delay: 0
});

const useMocks = () => {
  const [rules, setRules] = useState<IMockRule[]>(defaultRules);
  const [mocksEnabled, setMocksEnabled] = useState<boolean>(defaultMocksEnabled);

  useEffect(() => {
    getConfig('mockRules', defaultRules).then((stored) => {
      setRules(Array.isArray(stored) ? stored as IMockRule[] : defaultRules);
    });
    getConfig('mocksEnabled', defaultMocksEnabled).then((stored) => {
      setMocksEnabled(!!stored);
    });
  }, []);

  const persistRules = (mockRules: IMockRule[]) => {
    setRules(mockRules);
    chrome.storage.local.set({ mockRules });
  };

  const updateMocksEnabled = (mocksEnabled: boolean) => {
    setMocksEnabled(mocksEnabled);
    chrome.storage.local.set({ mocksEnabled });
  };

  const addRule = () => {
    persistRules([...rules, createMockRule()]);
  };

  const updateRule = (id: string, patch: Partial<IMockRule>) => {
    persistRules(rules.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule)));
  };

  const removeRule = (id: string) => {
    persistRules(rules.filter((rule) => rule.id !== id));
  };

  return {
    rules,
    mocksEnabled,
    setMocksEnabled: updateMocksEnabled,
    addRule,
    updateRule,
    removeRule
  };
};

type MocksContextType = ReturnType<typeof useMocks>;

export const MocksContext = createContext<MocksContextType>(null);

export const useMocksContext = (): MocksContextType => (
  useContext<MocksContextType>(MocksContext)
);

interface IComponentProps {
  children: React.ReactElement,
}

const MocksContextProvider: React.FC<IComponentProps> = ({ children }) => (
  <MocksContext.Provider value={ useMocks() }>
    { children }
  </MocksContext.Provider>
);

export default MocksContextProvider;
