import React from 'react';
import ReactDOM from 'react-dom/client';
import Layout from './components/Layout';
import SettingsContext from './logic/SettingsContext/SettingsContext';
import HttpArchiveContext from './logic/HTTPArchive/HttpArchiveContext';
import CacheContext from './logic/CacheContext/CacheContext';
import './index.scss';

ReactDOM.createRoot(document.getElementById('application')).render(
  <SettingsContext>
    <HttpArchiveContext>
      <CacheContext>
        <Layout />
      </CacheContext>
    </HttpArchiveContext>
  </SettingsContext>
);
