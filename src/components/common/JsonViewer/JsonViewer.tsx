import React from 'react';
import ReactJsonView, { ThemeKeys } from 'react-json-view';
import { JSONValue } from '../../../logic/HTTPArchive/IRequest';
import { useSettingsContext } from '../../../logic/SettingsContext';
import styles from './jsonViewer.scss';

interface IComponentProps {
  src: JSONValue,
  openNodeDepth?: number
}

const JsonViewer = ({ src, openNodeDepth = 1 }: IComponentProps) => {
  const { jsonViewerTheme } = useSettingsContext();
  return (
    <div className={ styles.jsonViewer }>
      <ReactJsonView
        name={ false }
        src={ src as object }
        theme={ jsonViewerTheme as ThemeKeys }
        collapsed={ openNodeDepth }
        enableClipboard={ false }
        indentWidth={ 2 }
        displayDataTypes={ false }
        iconStyle="square"
        quotesOnKeys={ false }
        displayObjectSize={ false }
      />
    </div>
  );
};

export default JsonViewer;
