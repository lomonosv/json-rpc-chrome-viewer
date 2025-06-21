import React, { MouseEventHandler } from 'react';
import { useRequestContext } from '~/logic/HTTPArchive/HttpArchiveContext';
import { useSettingsContext } from '~/logic/SettingsContext/SettingsContext';
import styles from './zeroCase.scss';

const ZeroCase = () => {
  const { filter, setFilter } = useRequestContext();
  const {
    includeJsonRpcLogs,
    includeWebsocketLogs,
    setIncludeJsonRpcLogs,
    setIncludeWebsocketLogs,
  } = useSettingsContext();

  const filterExists = filter || (!includeJsonRpcLogs && !includeWebsocketLogs);

  const handleClearFilter = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setFilter('');
    setIncludeJsonRpcLogs(true);
    setIncludeWebsocketLogs(false);
  };

  const handlePageReload: MouseEventHandler<HTMLAnchorElement> = (e) => {
    e.stopPropagation();
    e.preventDefault();
    chrome.devtools.inspectedWindow.reload({});
  };

  return (
    <div className={ styles.zeroCase }>
      <div>
        There are no JSON-RPC requests{ filterExists ? ' for current filter' : '' }<br />
        { filterExists ? <><a onClick={ handleClearFilter }>Clear</a> the filter </> : 'Perform a request ' }
        or <a onClick={ handlePageReload }>reload</a> the page to record activity
      </div>
    </div>
  );
};

export default ZeroCase;
