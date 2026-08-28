import React, { useEffect, useMemo, useRef, useState } from 'react';
import cn from 'classnames';
import { Resizable, ResizeCallback } from 're-resizable';
import { useRequestContext } from '~/logic/HTTPArchive/HttpArchiveContext';
import { SortDirection, SortField } from '~/logic/HTTPArchive/SortField';
import { useCacheContext } from '~/logic/CacheContext/CacheContext';
import { useSettingsContext } from '~/logic/SettingsContext/SettingsContext';
import { ViewMode } from '~/logic/SettingsContext/ViewMode';
import useSearchHighlight, { HighlightName } from '~/logic/common/useSearchHighlight';
import Header from '~/components/common/Header';
import Request from './Request';
import RequestInfo from '~/components/RequestInfo';
import ResponseInfo from '~/components/ResponseInfo';
import MessageInfo from '~/components/MessageInfo';
import useColumnResize from './useColumnResize';
import useColumnReorder from './useColumnReorder';
import {
  ResizableColumn,
  columnLabels,
  getColumnWidthProperties,
  getColumnWidthStyle
} from './columns';
import styles from './requestList.scss';

const minLeftSideWidth = 200;
const pendingTickIntervalMs = 250;

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
  const { requests, selected, filter } = useRequestContext();
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
  const {
    autoScroll,
    caseSensitiveSearch,
    showWaterfallColumn,
    showStatusColumn,
    showSizeColumn,
    showTimeColumn,
    viewMode
  } = useSettingsContext();
  const isAccordionView = viewMode === ViewMode.Accordion;
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

  const isColumnVisible: Record<ResizableColumn, boolean> = {
    [SortField.Waterfall]: showWaterfallColumn,
    [SortField.Status]: showStatusColumn,
    [SortField.Size]: showSizeColumn,
    [SortField.Time]: showTimeColumn
  };

  const visibleColumns = columnOrder.filter((field) => isColumnVisible[field]);

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

  useEffect(() => {
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
      minWidth={ minLeftSideWidth }
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
            requests.map((item, index) => (
              <React.Fragment key={ `${ item.request.url } - ${ index }` }>
                <Request
                  item={ item }
                  timelineStart={ timelineStart }
                  timelineEnd={ timelineEnd }
                  now={ now }
                />
                { isAccordionView && selected?.uuid === item.uuid && (
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
                    { item.isWebSocket ? (
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
            ))
          }
        </div>
      </div>
    </Resizable>
  );
};

export default RequestList;
