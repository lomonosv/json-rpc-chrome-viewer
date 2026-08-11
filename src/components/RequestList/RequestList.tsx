import React, { useEffect, useMemo, useRef } from 'react';
import cn from 'classnames';
import { Resizable } from 're-resizable';
import { useRequestContext } from '~/logic/HTTPArchive/HttpArchiveContext';
import { SortDirection, SortField } from '~/logic/HTTPArchive/SortField';
import { useCacheContext } from '~/logic/CacheContext/CacheContext';
import { useSettingsContext } from '~/logic/SettingsContext/SettingsContext';
import useSearchHighlight, { HighlightName } from '~/logic/common/useSearchHighlight';
import Header from '~/components/common/Header';
import Request from './Request';
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
    showTimeColumn
  } = useSettingsContext();

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
      width: selected ? requestListSectionWidth : '100%',
      height: '100%'
    });
  }, [selected]);

  useEffect(() => {
    resizableRef.current.updateSize({
      width: selected ? requestListSectionWidth : '100%',
      height: '100%'
    });
  }, [selected]);

  useEffect(() => {
    if (autoScroll && !selected) {
      requestsWrapperRef.current.scrollTop = requestsWrapperRef.current.scrollHeight;
    }
  }, [autoScroll, requests]);

  const { timelineStart, timelineEnd } = useMemo(() => {
    if (!requests.length) {
      return { timelineStart: 0, timelineEnd: 1 };
    }

    return requests.reduce((acc, request) => ({
      timelineStart: Math.min(acc.timelineStart, request.startTime),
      timelineEnd: Math.max(acc.timelineEnd, request.startTime + (request.isWebSocket ? 0 : request.time))
    }), { timelineStart: Infinity, timelineEnd: -Infinity });
  }, [requests]);

  const handleResize = () => {
    updateRequestListSectionWidth(resizableRef.current.size.width);
  };

  return (
    <Resizable
      ref={ resizableRef }
      enable={ {
        top: false,
        right: !!selected,
        bottom: false,
        left: false,
        topRight: false,
        bottomRight: false,
        bottomLeft: false,
        topLeft: false
      } }
      className={ className }
      minWidth={ minLeftSideWidth }
      maxWidth={ selected ? '80%' : '100%' }
      defaultSize={ {
        width: selected ? requestListSectionWidth : '100%',
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
              <Request
                key={ `${ item.request.url } - ${ index }` }
                item={ item }
                timelineStart={ timelineStart }
                timelineEnd={ timelineEnd }
              />
            ))
          }
        </div>
      </div>
    </Resizable>
  );
};

export default RequestList;
