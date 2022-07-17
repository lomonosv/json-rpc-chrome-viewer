import React, { MouseEventHandler } from 'react';
import { useRequestContext } from '~/logic/HTTPArchive/HttpArchiveContext';
import styles from './zeroCase.scss';

const ZeroCase = () => {
  const { filter, setFilter } = useRequestContext();

  const handleClearFilter = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setFilter('');
  };

  const handlePageReload: MouseEventHandler<HTMLAnchorElement> = (e) => {
    e.stopPropagation();
    e.preventDefault();
    chrome.devtools.inspectedWindow.reload({});
  };

  return (
    <div className={ styles.zeroCase }>
      <div>
        There are no JSON-RPC requests{ filter ? ' for current filter' : '' }<br />
        { filter ? <><a onClick={ handleClearFilter }>Clear</a> the filter </> : 'Perform a request ' }
        or <a onClick={ handlePageReload }>reload</a> the page to record activity
      </div>
    </div>
  );
};

export default ZeroCase;
