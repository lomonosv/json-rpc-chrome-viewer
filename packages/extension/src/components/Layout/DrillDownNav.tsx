import React from 'react';
import { useRequestContext } from '~/logic/HTTPArchive/HttpArchiveContext';
import { getRequestLabel } from '~/logic/HTTPArchive/filters';
import Header from '~/components/common/Header';
import styles from './layout.scss';

const DrillDownNav = () => {
  const {
    selected,
    requests,
    clearSelection,
    selectAdjacent
  } = useRequestContext();
  const position = requests.findIndex(({ uuid }) => uuid === selected.uuid) + 1;
  const label = getRequestLabel(selected);

  return (
    <Header className={ styles.drillDownNav }>
      <button
        type="button"
        className={ styles.navButton }
        title="Back to the list (Esc)"
        onClick={ clearSelection }
      >
        ‹ Back
      </button>
      <span className={ styles.navLabel } title={ label }>{ label }</span>
      <span className={ styles.navPosition }>{ position } / { requests.length }</span>
      <button
        type="button"
        className={ styles.navButton }
        title="Previous request (↑)"
        onClick={ () => selectAdjacent(-1) }
      >
        ▲
      </button>
      <button
        type="button"
        className={ styles.navButton }
        title="Next request (↓)"
        onClick={ () => selectAdjacent(1) }
      >
        ▼
      </button>
    </Header>
  );
};

export default DrillDownNav;
