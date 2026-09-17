import React, { useEffect, useMemo, useRef, useState } from 'react';
import cn from 'classnames';
import { Resizable, ResizeCallback } from 're-resizable';
import { useRequestContext } from '~/logic/HTTPArchive/HttpArchiveContext';
import { SortDirection, SortField } from '~/logic/HTTPArchive/SortField';
import { useCacheContext } from '~/logic/CacheContext/CacheContext';
import { useSettingsContext } from '~/logic/SettingsContext/SettingsContext';
import useIsAccordionView from '~/logic/common/useIsAccordionView';
import useSearchHighlight, { HighlightName } from '~/logic/common/useSearchHighlight';
import Header from '~/components/common/Header';
import Request from './Request';
import RequestInfo from '~/components/RequestInfo';
import ResponseInfo from '~/components/ResponseInfo';
import MessageInfo from '~/components/MessageInfo';
import useColumnResize from './useColumnResize';
import useColumnReorder from './useColumnReorder';
import useVisibleColumns from './useVisibleColumns';
import {
  ResizableColumn,
  columnLabels,
  getColumnWidthProperties,
  getColumnWidthStyle
} from './columns';
import styles from './requestList.scss';

const minLeftSideWidth = 200;
const pendingTickIntervalMs = 250;
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
  const isAccordionView = useIsAccordionView();
  const isSideBySide = !!selected && !isAccordionView;

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

  useEffect(() => {
    resizableRef.current.updateSize({
      width: isSideBySide ? requestListSectionWidth : '100%',
      height: '100%'
    });
  }, [isSideBySide]);

  useEffect(() => {
    resizableRef.current.updateSize({
      width: isSideBySide ? requestListSectionWidth : '100%',
      height: '100%'
    });
  }, [isSideBySide]);

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
      requestsWrapperRef.current.scrollTop = requestsWrapperRef.current.scrollHeight;
    }
  }, [autoScroll, requests]);

  const [now, setNow] = useState<number>(() => Date.now());
  const hasPending = useMemo(() => requests.some((request) => request.isPending), [requests]);

  useEffect(() => {
    if (!hasPending) {
      return undefined;
    }

    const interval = setInterval(() => setNow(Date.now()), pendingTickIntervalMs);

    return () => clearInterval(interval);
  }, [hasPending]);

  const { timelineStart, timelineEnd } = useMemo(() => {
    if (!requests.length) {
      return { timelineStart: 0, timelineEnd: 1 };
    }

    return requests.reduce((acc, request) => {
      const endTime = request.isPending
        ? now
        : request.startTime + (request.isWebSocket ? 0 : request.time);

      return {
        timelineStart: Math.min(acc.timelineStart, request.startTime),
        timelineEnd: Math.max(acc.timelineEnd, endTime)
      };
    }, { timelineStart: Infinity, timelineEnd: -Infinity });
  }, [requests, now]);

  const handleResize = () => {
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
        bottom: false,
        left: false,
        topRight: false,
        bottomRight: false,
        bottomLeft: false,
        topLeft: false
      } }
      className={ className }
      minWidth={ isSideBySide ? minLeftSideWidth : undefined }
      maxWidth={ isSideBySide ? '80%' : '100%' }
      defaultSize={ {
        width: isSideBySide ? requestListSectionWidth : '100%',
        height: '100%'
      } }
      onResizeStop={ handleResize }
      handleClasses={ {
        right: styles.paneResizeHandle
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
            rows.map((row, index) => (row.kind === 'group' ? (
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
              <React.Fragment key={ `${ row.request.request.url } - ${ index }` }>
                <Request
                  item={ row.request }
                  timelineStart={ timelineStart }
                  timelineEnd={ timelineEnd }
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
                    { row.request.isWebSocket ? (
                      <MessageInfo />
                    ) : (
                      <>
                        <RequestInfo />
                        <ResponseInfo />
                      </>
                    ) }
                  </Resizable>
                ) }
              </React.Fragment>
            )))
          }
        </div>
      </div>
    </Resizable>
  );
};

export default RequestList;
