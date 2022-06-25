import React from 'react';
import ReactDOM from 'react-dom/client';
import Layout from './components/Layout';
import HttpArchiveContext from './logic/HTTPArchive/HttpArchiveContext';

ReactDOM.createRoot(document.getElementById('application')).render(
  <HttpArchiveContext>
    <Layout />
  </HttpArchiveContext>
);
