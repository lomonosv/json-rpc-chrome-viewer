import React from 'react';
import Layout from '~/components/Layout';
import SettingsContext from '~/logic/SettingsContext/SettingsContext';
import HttpArchiveContext from '~/logic/HTTPArchive/HttpArchiveContext';
import CacheContext from '~/logic/CacheContext/CacheContext';
import MocksContext from '~/logic/Mocks/MocksContext';
import { createContainer } from '~/logic/DI';
import ErrorBoundary from './ErrorBoundary';

const Application = () => (
  <ErrorBoundary>
    <SettingsContext>
      <HttpArchiveContext>
        <CacheContext>
          <MocksContext>
            <Layout />
          </MocksContext>
        </CacheContext>
      </HttpArchiveContext>
    </SettingsContext>
  </ErrorBoundary>
);

export default createContainer(Application);
