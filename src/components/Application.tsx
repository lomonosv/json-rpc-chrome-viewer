import React from 'react';
import Layout from '~/components/Layout';
import SettingsContext from '~/logic/SettingsContext/SettingsContext';
import HttpArchiveContext from '~/logic/HTTPArchive/HttpArchiveContext';
import CacheContext from '~/logic/CacheContext/CacheContext';

const Application = () => (
  <SettingsContext>
    <HttpArchiveContext>
      <CacheContext>
        <Layout />
      </CacheContext>
    </HttpArchiveContext>
  </SettingsContext>
);

export default Application;
