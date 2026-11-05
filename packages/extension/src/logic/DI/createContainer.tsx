import React from 'react';
import Container from './Container';
import DIContext from '~/logic/DI/DIContext';

const createContainer = (App: React.ElementType) => {
  const container = new Container();

  return () => (
    <DIContext container={ container }>
      <App />
    </DIContext>
  );
};

export default createContainer;
