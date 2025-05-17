import React from 'react';
import { Container } from 'inversify';
import type { Scope } from '@sentry/browser';
import { DITypes, useDIContext } from '~/logic/DI';
import SentryIntegration from './SentryIntegration';
import Fallback from './Fallback';

interface IProps {
  container: Container,
  children: React.ReactElement,
}

interface IState {
  hasError: boolean,
}

class ErrorBoundary extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    this.props.container.get<Scope>(DITypes.Scope).captureException(error);
  }

  render() {
    return this.state.hasError ? <Fallback /> : this.props.children;
  }
}

export default ({ children }: Omit<IProps, 'container'>) => {
  const { container } = useDIContext();

  return (
    <SentryIntegration>
      <ErrorBoundary container={ container }>
        { children }
      </ErrorBoundary>
    </SentryIntegration>
  );
};
