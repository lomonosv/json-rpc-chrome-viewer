import React, { MouseEventHandler } from 'react';
import styles from './zeroCase.scss';

const ZeroCase = () => {
  const handlePageReload: MouseEventHandler<HTMLAnchorElement> = (e) => {
    e.stopPropagation();
    e.preventDefault();
    chrome.devtools.inspectedWindow.reload({});
  };

  return (
    <div className={ styles.zeroCase }>
      <div>
        There are no JSON-RPC requests<br />
        Perform a request or <a onClick={ handlePageReload }>reload</a> the page to record activity
      </div>
    </div>
  );
};

export default ZeroCase;
