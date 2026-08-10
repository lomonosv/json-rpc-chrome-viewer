import { useEffect } from 'react';
import {
  BrowserClient,
  defaultStackParser,
  getDefaultIntegrations,
  rewriteFramesIntegration,
  makeFetchTransport,
  setCurrentClient,
  Scope,
} from '@sentry/browser';
import { useDIContext } from '~/logic/DI/DIContext';
import { DITypes } from '~/logic/DI/DITypes';

const SentryIntegration = ({ children }) => {
  const { container } = useDIContext();

  useEffect(() => {
    // GlobalHandlers (window.onerror / onunhandledrejection) and BrowserApiErrors
    // (wraps addEventListener & timer callbacks) are what capture errors outside of
    // React rendering. Breadcrumbs stays disabled to keep devtools noise out of events.
    const integrations = getDefaultIntegrations({}).filter(
      (defaultIntegration) => !['Breadcrumbs'].includes(
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

    // GlobalHandlers only reports when getClient() matches its own client, so the
    // client has to be registered globally as well as on the DI-injected scope.
    setCurrentClient(client);
    client.init();

    container.bind(DITypes.Scope).toConstantValue(scope);
  }, []);

  return children;
};

export default SentryIntegration;
