import React, { useState, useEffect, useRef } from 'react';
import ReactJsonView, { ThemeKeys } from '@microlink/react-json-view';
import { JSONValue } from '~/logic/HTTPArchive/IRequest';
import { useSettingsContext } from '~/logic/SettingsContext/SettingsContext';
import { ExpandTreeState } from './ExpandTreeState';
import { expandAllLevels } from './ExpandLevel';
import useCollapsedPreview from './useCollapsedPreview';
import styles from './jsonViewer.scss';

interface IComponentProps {
  src: JSONValue,
  defaultOpenNodesDepth?: number,
  expandTreeState: ExpandTreeState,
  expandLevel?: number,
  onEdit?: (edit: any) => void,
}

const getCollapsed = (
  expandTreeState: ExpandTreeState,
  expandLevel: number,
  defaultOpenNodesDepth: number
): boolean | number => {
  if (expandTreeState === ExpandTreeState.Collapsed) {
    return true;
  }

  if (expandTreeState === ExpandTreeState.Expanded) {
    return expandLevel === expandAllLevels ? false : expandLevel;
  }

  return defaultOpenNodesDepth;
};

const JsonViewer = ({
  src,
  defaultOpenNodesDepth = 1,
  expandTreeState,
  expandLevel = expandAllLevels,
  onEdit
}: IComponentProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const { systemJsonViewerTheme, showCollapsedPreview } = useSettingsContext();

  useCollapsedPreview(containerRef, src, showCollapsedPreview && isInitialized);

  const collapsed = getCollapsed(expandTreeState, expandLevel, defaultOpenNodesDepth);

  useEffect(() => {
    setIsInitialized(false);

    setTimeout(() => {
      setIsInitialized(true);
    }, 0);
  }, [src]);

  return (
    <div
      ref={ containerRef }
      className={ styles.jsonViewer }
    >
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
            onEdit={ onEdit }
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
