import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  BrowserClient,
  defaultStackParser,
  getDefaultIntegrations,
  makeFetchTransport,
  Scope,
} from '@sentry/browser';
import Application from '~/components/Application';
import './index.scss';

const integrations = getDefaultIntegrations({}).filter(
  (defaultIntegration) => !['BrowserApiErrors', 'Breadcrumbs', 'GlobalHandlers'].includes(
    defaultIntegration.name
  )
);

const client = new BrowserClient({
  dsn: process.env.SENTRY_DSN,
  transport: makeFetchTransport,
  stackParser: defaultStackParser,
  integrations
});

const scope = new Scope();
scope.setClient(client);
client.init(); // initializing has to be done after setting the client on the scope

// You can capture exceptions manually for this client like this:
// scope.captureException(new Error('example'));

ReactDOM.createRoot(document.getElementById('application')).render(<>
  <button onClick={ () => { scope.captureException(new Error('example')); } }>Throw exception</button>
  <Application />
</>);
