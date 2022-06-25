import React from 'react';
import ReactJsonView from 'react-json-view';
import styles from './jsonViewer.scss';

interface IComponentProps {
  src: object
}

const JsonViewer = ({ src }: IComponentProps) => {
  const theme = chrome.devtools.panels.themeName === 'dark' ? 'summerfruit' : 'summerfruit:inverted';

  return (
    <div className={ styles.jsonViewer }>
      <ReactJsonView
        src={ src }
        theme={ theme }
        collapsed={ 2 }
        enableClipboard={ false }
        indentWidth={ 2 }
        displayDataTypes={ false }
        iconStyle="square"
      />
    </div>
  );
};

export default JsonViewer;
