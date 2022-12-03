import React, { useState, useEffect } from 'react';
import ReactJsonView, { ThemeKeys } from 'react-json-view';
import { JSONValue } from '~/logic/HTTPArchive/IRequest';
import { useSettingsContext } from '~/logic/SettingsContext/SettingsContext';
import { ExpandTreeState } from './ExpandTreeState';
import styles from './jsonViewer.scss';

interface IComponentProps {
  src: JSONValue,
  defaultOpenNodesDepth?: number,
  expandTreeState: ExpandTreeState
}

const JsonViewer = ({ src, defaultOpenNodesDepth = 1, expandTreeState }: IComponentProps) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const { systemJsonViewerTheme } = useSettingsContext();

  const collapsed = expandTreeState === ExpandTreeState.Default
    ? defaultOpenNodesDepth
    : expandTreeState === ExpandTreeState.Collapsed;

  useEffect(() => {
    setIsInitialized(false);

    setTimeout(() => {
      setIsInitialized(true);
    }, 0);
  }, [src]);

  return (
    <div className={ styles.jsonViewer }>
      { isInitialized && (
        typeof src === 'object' ? (
          <ReactJsonView
            name={ false }
            src={ src as object }
            theme={ systemJsonViewerTheme.toLowerCase() as ThemeKeys }
            collapsed={ collapsed }
            enableClipboard={ false }
            indentWidth={ 2 }
            displayDataTypes={ false }
            iconStyle="square"
            quotesOnKeys={ false }
            displayObjectSize={ false }
          />
        ) : (
          <div className="react-json-view">
            { src }
          </div>
        )
      ) }
    </div>
  );
};

export default JsonViewer;
