import React, { useEffect, useRef } from 'react';
import cn from 'classnames';
import { Resizable, ResizeCallback } from 're-resizable';
import { useRequestContext } from '~/logic/HTTPArchive/HttpArchiveContext';
import { useSettingsContext } from '~/logic/SettingsContext/SettingsContext';
import { useCacheContext } from '~/logic/CacheContext/CacheContext';
import { ViewMode } from '~/logic/SettingsContext/ViewMode';
import useEffectiveViewMode from '~/logic/common/useEffectiveViewMode';
import RequestList from '~/components/RequestList';
import RequestDetail from '~/components/RequestDetail';
import Toolbar from '~/components/Toolbar';
import Header from '~/components/common/Header';
import ZeroCase from './ZeroCase';
import DrillDownNav from './DrillDownNav';
import styles from './layout.scss';

const minDrawerWidth = 280;

const Layout = () => {
  const layoutRef = useRef<HTMLDivElement>(null);
  const {
    selected,
    requests,
    serverRequestsCount,
    clearSelection
  } = useRequestContext();
  const hasRows = !!requests.length || !!serverRequestsCount;
  const { isDarkTheme } = useSettingsContext();
  const { drawerWidth, updateDrawerWidth } = useCacheContext();
  const viewMode = useEffectiveViewMode();
  const isOverlay = viewMode === ViewMode.Drawer || viewMode === ViewMode.DrillDown;

  useEffect(() => {
    const body = document.getElementsByTagName('body')[0];
    body.classList.remove('isDark');

    if (isDarkTheme) {
      body.classList.add('isDark');
    }
  }, [isDarkTheme]);

  useEffect(() => {
    if (!isOverlay || !selected) {
      return undefined;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // A dialog portalled outside the layout owns its own Escape.
      const isInLayout = e.target === document.body || layoutRef.current.contains(e.target as Node);

      if (e.key === 'Escape' && isInLayout) {
        clearSelection();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOverlay, selected]);

  const handleDrawerResizeStop: ResizeCallback = (event, direction, elementRef) => {
    updateDrawerWidth(elementRef.offsetWidth);
  };

  const renderDetail = () => {
    if (!selected || viewMode === ViewMode.Accordion) {
      return null;
    }

    if (viewMode === ViewMode.Stacked) {
      return (
        <div className={ styles.bottomContainer }>
          <RequestDetail isAlwaysTabbed />
        </div>
      );
    }

    if (viewMode === ViewMode.Drawer) {
      return (
        <Resizable
          className={ styles.drawer }
          enable={ {
            top: false,
            right: false,
            bottom: false,
            left: true,
            topRight: false,
            bottomRight: false,
            bottomLeft: false,
            topLeft: false
          } }
          minWidth={ minDrawerWidth }
          maxWidth="90%"
          defaultSize={ {
            width: drawerWidth,
            height: '100%'
          } }
          onResizeStop={ handleDrawerResizeStop }
          handleClasses={ {
            left: styles.drawerResizeHandle
          } }
        >
          <RequestDetail />
        </Resizable>
      );
    }

    if (viewMode === ViewMode.DrillDown) {
      return (
        <div className={ styles.drillDown }>
          <DrillDownNav />
          <RequestDetail isClosable={ false } />
        </div>
      );
    }

    return (
      <div className={ styles.rightSideContainer }>
        <RequestDetail />
      </div>
    );
  };

  return (
    <div
      ref={ layoutRef }
      className={ styles.layoutWrapper }
    >
      <Header>
        <Toolbar />
      </Header>
      <div
        className={ cn(styles.layoutContainer, {
          [styles.isStacked]: viewMode === ViewMode.Stacked
        }) }
      >
        { !hasRows && <ZeroCase /> }
        { hasRows && (
          <>
            <RequestList
              className={ cn(styles.leftSideContainer, {
                [styles.isBesideDetail]: !!selected && viewMode === ViewMode.Panes
              }) }
            />
            { renderDetail() }
          </>
        ) }
      </div>
    </div>
  );
};

export default Layout;
