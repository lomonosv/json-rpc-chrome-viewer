import React, { createContext, useContext } from 'react';
import { Container } from 'inversify';

const useDI = (container: Container) => ({
  container
});

type DIContextType = ReturnType<typeof useDI>;

export const DIContext = createContext<DIContextType>(null);

export const useDIContext = (): DIContextType => (
  useContext<DIContextType>(DIContext)
);

interface IComponentProps {
  children: React.ReactElement,
  container: Container,
}

const DIContextProvider: React.FC<IComponentProps> = ({ children, container }) => (
  <DIContext.Provider value={ useDI(container) }>
    { children }
  </DIContext.Provider>
);

export default DIContextProvider;
