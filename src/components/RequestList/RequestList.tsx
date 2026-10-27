import React, { useEffect, useMemo, useRef, useState } from 'react';
import cn from 'classnames';
import { Resizable, ResizeCallback } from 're-resizable';
import { useRequestContext } from '~/logic/HTTPArchive/HttpArchiveContext';
import { SortDirection, SortField } from '~/logic/HTTPArchive/SortField';
import { useCacheContext } from '~/logic/CacheContext/CacheContext';
import { useSettingsContext } from '~/logic/SettingsContext/SettingsContext';
import useEffectiveViewMode from '~/logic/common/useEffectiveViewMode';
import { ViewMode } from '~/logic/SettingsContext/ViewMode';
import useSearchHighlight, { HighlightName } from '~/logic/common/useSearchHighlight';
import useNamespaceHighlight from './useNamespaceHighlight';
import { getTimeline } from './timeline';
import Header from '~/components/common/Header';
import Request from './Request';
import RequestDetail from '~/components/RequestDetail';
import useColumnResize from './useColumnResize';
import useColumnReorder from './useColumnReorder';
import useVisibleColumns from './useVisibleColumns';
import ListSummary from './ListSummary';
import {
  ResizableColumn,
  columnLabels,
  getColumnWidthProperties,
  getColumnWidthStyle
} from './columns';
import styles from './requestList.scss';

const minLeftSideWidth = 200;
const minStackedListHeight = 80;
const pendingTickIntervalMs = 100;
const groupRevealWindowMs = 500;

interface ISortableHeaderProps {
  field: SortField,
  className?: string,
  resizeHandle?: React.ReactElement,
  shouldIgnoreClick?: () => boolean,
  reorderProps?: object,
  children: string,
}

const SortableHeader = ({
  field,
  className,
  resizeHandle,
  shouldIgnoreClick,
  reorderProps,
  children
}: ISortableHeaderProps) => {
  const { sortField, sortDirection, toggleSort } = useRequestContext();
  const isSorted = sortField === field;

  const handleClick = () => {
    if (shouldIgnoreClick?.()) {
      return;
    }

    toggleSort(field);
  };

  return (
    <button
      type="button"
      title={ `Sort by ${ field }` }
      className={ cn(styles.sortableHeader, className) }
      style={ field === SortField.Method ? undefined : getColumnWidthStyle(field as ResizableColumn) }
      onClick={ handleClick }
      { ...reorderProps }
    >
      { resizeHandle }
      { children }
      { isSorted && (
        <span className={ styles.sortIndicator }>
          { sortDirection === SortDirection.Asc ? '▲' : '▼' }
        </span>
      ) }
    </button>
  );
};

interface IComponentProps {
  className?: string,
}

const RequestList = ({ className }: IComponentProps) => {
  const resizableRef = useRef<Resizable>(null);
  const requestsWrapperRef = useRef<HTMLDivElement>(null);
  const {
    requests,
    rows,
    selected,
    filter,
    toggleServerGroup
  } = useRequestContext();
  const {
    requestListSectionWidth,
    updateRequestListSectionWidth,
    accordionSectionHeight,
    updateAccordionSectionHeight,
    stackedListHeight,
    updateStackedListHeight,
    columnWidths,
    getColumnWidth,
    setColumnWidth,
    persistColumnWidths,
    columnOrder,
    updateColumnOrder
  } = useCacheContext();
  const { autoScroll, caseSensitiveSearch } = useSettingsContext();
  const [revealingGroupId, setRevealingGroupId] = useState<string>(null);
  const revealTimerRef = useRef<number>(null);
  const viewMode = useEffectiveViewMode();
  const isAccordionView = viewMode === ViewMode.Accordion;
  const isSideBySide = !!selected && viewMode === ViewMode.Panes;
  const isStackedAbove = !!selected && viewMode === ViewMode.Stacked;

  const {
    resizingField,
    getResizeHandleProps,
    consumeClickSuppression: consumeResizeClick
  } = useColumnResize(
    getColumnWidth,
    setColumnWidth,
    persistColumnWidths
  );

  const visibleColumns = useVisibleColumns();

  const {
    draggingField,
    dropIndex,
    getReorderProps,
    consumeClickSuppression: consumeReorderClick
  } = useColumnReorder(columnOrder, visibleColumns, updateColumnOrder);

  const renderResizeHandle = (field: ResizableColumn) => (
    <span
      aria-hidden="true"
      className={ cn(styles.resizeHandle, { [styles.isResizing]: resizingField === field }) }
      { ...getResizeHandleProps(field) }
    />
  );

  const handleServerGroupClick = (id: string, wasExpanded: boolean) => {
    toggleServerGroup(id);

    window.clearTimeout(revealTimerRef.current);

    if (wasExpanded) {
      setRevealingGroupId(null);

      return;
    }

    setRevealingGroupId(id);

    revealTimerRef.current = window.setTimeout(() => {
      setRevealingGroupId(null);
    }, groupRevealWindowMs);
  };

  useEffect(() => () => window.clearTimeout(revealTimerRef.current), []);

  const revealIndexes = useMemo(() => {
    const indexes = new Map<string, number>();

    if (!revealingGroupId) {
      return indexes;
    }

    rows.forEach((row) => {
      if (row.kind === 'request' && row.request.serverGroupId === revealingGroupId) {
        indexes.set(row.request.uuid, indexes.size);
      }
    });

    return indexes;
  }, [rows, revealingGroupId]);

  const shouldIgnoreHeaderClick = () => {
    const afterResize = consumeResizeClick();
    const afterReorder = consumeReorderClick();

    return afterResize || afterReorder;
  };

  useSearchHighlight(
    requestsWrapperRef,
    HighlightName.List,
    filter,
    caseSensitiveSearch,
    `.${ styles.requestsHeaderWrapper }`
  );

  useNamespaceHighlight(requestsWrapperRef);

  const listSize = {
    width: isSideBySide ? requestListSectionWidth : '100%',
    height: isStackedAbove ? stackedListHeight : '100%'
  };

  useEffect(() => {
    resizableRef.current.updateSize(listSize);
  }, [isSideBySide, isStackedAbove]);

  const groupStates = new Map(
    rows.flatMap((row) => (row.kind === 'group' ? [[row.group.id, row.group.isExpanded] as const] : []))
  );
  const lastGroupStatesRef = useRef(groupStates);

  useEffect(() => {
    const isGroupToggle = [...groupStates].some(([id, isExpanded]) => (
      lastGroupStatesRef.current.has(id) && lastGroupStatesRef.current.get(id) !== isExpanded
    ));

    lastGroupStatesRef.current = groupStates;

    if (isGroupToggle) {
      return;
    }

    if (autoScroll && !selected) {
      const isReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

      requestsWrapperRef.current.scrollTo({
        top: requestsWrapperRef.current.scrollHeight,
        behavior: isReducedMotion ? 'auto' : 'smooth'
      });
    }
  }, [autoScroll, requests]);

  // Ticks only while a call is in flight: its bar ends now (timeline.ts).
  const [now, setNow] = useState<number>(() => Date.now());
  const hasPending = useMemo(() => requests.some((request) => request.isPending), [requests]);

  useEffect(() => {
    if (!hasPending) {
      return undefined;
    }

    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), pendingTickIntervalMs);

    return () => clearInterval(interval);
  }, [hasPending]);

  const timeline = useMemo(() => getTimeline(requests, now), [requests, now]);

  const handleResize = () => {
    if (isStackedAbove) {
      updateStackedListHeight(resizableRef.current.size.height);

      return;
    }

    updateRequestListSectionWidth(resizableRef.current.size.width);
  };

  const handleAccordionResizeStop: ResizeCallback = (event, direction, elementRef) => {
    updateAccordionSectionHeight(elementRef.offsetHeight);
  };

  return (
    <Resizable
      ref={ resizableRef }
      enable={ {
        top: false,
        right: isSideBySide,
        bottom: isStackedAbove,
        left: false,
        topRight: false,
        bottomRight: false,
        bottomLeft: false,
        topLeft: false
      } }
      className={ className }
      minWidth={ isSideBySide ? minLeftSideWidth : undefined }
      maxWidth={ isSideBySide ? '80%' : '100%' }
      minHeight={ isStackedAbove ? minStackedListHeight : undefined }
      maxHeight={ isStackedAbove ? '85%' : '100%' }
      defaultSize={ listSize }
      onResizeStop={ handleResize }
      handleClasses={ {
        right: styles.paneResizeHandle,
        bottom: styles.stackedResizeHandle
      } }
    >
      <div
        ref={ requestsWrapperRef }
        className={ styles.requestListWrapper }
      >
        <div
          className={ styles.requestList }
          style={ getColumnWidthProperties(columnWidths) }
        >
          <div className={ styles.requestsHeaderWrapper }>
            <Header className={ styles.requestsHeader }>
              <SortableHeader field={ SortField.Method } className={ styles.methodHeader }>
                Method
              </SortableHeader>
              <div className={ styles.metaHeaders }>
                { visibleColumns.map((field, index) => (
                  <React.Fragment key={ field }>
                    { dropIndex === index && <span className={ styles.dropIndicator } /> }
                    <SortableHeader
                      field={ field }
                      className={ cn({
                        [styles.waterfallHeader]: field === SortField.Waterfall,
                        [styles.isDragging]: draggingField === field
                      }) }
                      resizeHandle={ renderResizeHandle(field) }
                      shouldIgnoreClick={ shouldIgnoreHeaderClick }
                      reorderProps={ getReorderProps(field) }
                    >
                      { columnLabels[field] }
                    </SortableHeader>
                  </React.Fragment>
                )) }
                { dropIndex === visibleColumns.length && <span className={ styles.dropIndicator } /> }
              </div>
            </Header>
          </div>
          {
            rows.map((row) => (row.kind === 'group' ? (
              <button
                key={ row.group.id }
                type="button"
                className={ styles.serverGroup }
                aria-expanded={ row.group.isExpanded }
                title={ row.group.isExpanded ? 'Collapse server-side calls' : 'Expand server-side calls' }
                onClick={ () => handleServerGroupClick(row.group.id, row.group.isExpanded) }
              >
                <span
                  aria-hidden="true"
                  className={ cn(styles.serverGroupChevron, {
                    [styles.isGroupExpanded]: row.group.isExpanded
                  }) }
                />
                <span className={ styles.serverGroupLabel }>{ row.group.label }</span>
                <span className={ styles.serverGroupCount }>
                  { row.group.count } { row.group.count === 1 ? 'call' : 'calls' }
                </span>
              </button>
            ) : (
              // Keyed by identity: a positional key moves row state to another request.
              <React.Fragment key={ row.request.uuid }>
                <Request
                  item={ row.request }
                  timeline={ timeline }
                  now={ now }
                  revealIndex={ revealIndexes.get(row.request.uuid) }
                />
                { isAccordionView && selected?.uuid === row.request.uuid && (
                  <Resizable
                    className={ styles.accordionDetail }
                    enable={ {
                      top: false,
                      right: false,
                      bottom: true,
                      left: false,
                      topRight: false,
                      bottomRight: false,
                      bottomLeft: false,
                      topLeft: false
                    } }
                    minHeight={ 120 }
                    defaultSize={ {
                      width: '100%',
                      height: accordionSectionHeight
                    } }
                    onResizeStop={ handleAccordionResizeStop }
                    handleClasses={ {
                      bottom: styles.accordionResizeHandle
                    } }
                  >
                    <RequestDetail />
                  </Resizable>
                ) }
              </React.Fragment>
            )))
          }
        </div>
      </div>
      <ListSummary requests={ requests } timelineSpan={ requests.length ? timeline.span : 0 } />
    </Resizable>
  );
};

export default RequestList;
