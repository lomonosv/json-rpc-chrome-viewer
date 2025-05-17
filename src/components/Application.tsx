import React from 'react';
import Layout from '~/components/Layout';
import SettingsContext from '~/logic/SettingsContext/SettingsContext';
import HttpArchiveContext from '~/logic/HTTPArchive/HttpArchiveContext';
import CacheContext from '~/logic/CacheContext/CacheContext';
import { createContainer } from '~/logic/DI';
import ErrorBoundary from './ErrorBoundary';

const Application = () => (
  <ErrorBoundary>
    <SettingsContext>
      <HttpArchiveContext>
        <CacheContext>
          <Layout />
        </CacheContext>
      </HttpArchiveContext>
    </SettingsContext>
  </ErrorBoundary>
);

export default createContainer(Application);
