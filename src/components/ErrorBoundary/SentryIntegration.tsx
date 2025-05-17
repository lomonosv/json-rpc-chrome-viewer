import { useEffect } from 'react';
import {
  BrowserClient,
  defaultStackParser,
  getDefaultIntegrations,
  rewriteFramesIntegration,
  makeFetchTransport,
  Scope,
} from '@sentry/browser';
import { useDIContext } from '~/logic/DI/DIContext';
import { DITypes } from '~/logic/DI/DITypes';

const SentryIntegration = ({ children }) => {
  const { container } = useDIContext();

  useEffect(() => {
    const integrations = getDefaultIntegrations({}).filter(
      (defaultIntegration) => !['BrowserApiErrors', 'Breadcrumbs', 'GlobalHandlers'].includes(
        defaultIntegration.name
      )
    );

    const client = new BrowserClient({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.ENVIRONMENT,
      transport: makeFetchTransport,
      stackParser: defaultStackParser,
      integrations: [
        ...integrations,
        rewriteFramesIntegration({
          iteratee: (frame) => {
            if (frame.filename?.startsWith('chrome-extension://')) {
              const fileName = frame.filename.split('/').pop();
              frame.filename = `app:///${ fileName }`;
            }
            return frame;
          },
        })
      ]
    });

    const scope = new Scope();
    scope.setClient(client);
    client.init(); // initializing has to be done after setting the client on the scope

    container.bind(DITypes.Scope).toConstantValue(scope);
  }, []);

  return children;
};

export default SentryIntegration;
