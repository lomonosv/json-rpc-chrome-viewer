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
import styles from './requestList.scss';

const minLeftSideWidth = 200;

interface ISortableHeaderProps {
  field: SortField,
  className?: string,
  children: string,
}

const SortableHeader = ({ field, className, children }: ISortableHeaderProps) => {
  const { sortField, sortDirection, toggleSort } = useRequestContext();
  const isSorted = sortField === field;

  return (
    <button
      type="button"
      title={ `Sort by ${ field }` }
      className={ cn(styles.sortableHeader, className) }
      onClick={ () => toggleSort(field) }
    >
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
  const { requestListSectionWidth, updateRequestListSectionWidth } = useCacheContext();
  const {
    autoScroll,
    caseSensitiveSearch,
    showWaterfallColumn,
    showStatusColumn,
    showSizeColumn,
    showTimeColumn
  } = useSettingsContext();

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
    >
      <div
        ref={ requestsWrapperRef }
        className={ styles.requestListWrapper }
      >
        <div className={ styles.requestList }>
          <div className={ styles.requestsHeaderWrapper }>
            <Header className={ styles.requestsHeader }>
              <SortableHeader field={ SortField.Method } className={ styles.methodHeader }>
                Method
              </SortableHeader>
              <div className={ styles.metaHeaders }>
                { showWaterfallColumn && (
                  <SortableHeader field={ SortField.Waterfall } className={ styles.waterfallHeader }>
                    Waterfall
                  </SortableHeader>
                ) }
                { showStatusColumn && (
                  <SortableHeader field={ SortField.Status }>Status</SortableHeader>
                ) }
                { showSizeColumn && (
                  <SortableHeader field={ SortField.Size }>Size (B)</SortableHeader>
                ) }
                { showTimeColumn && (
                  <SortableHeader field={ SortField.Time }>Time (ms)</SortableHeader>
                ) }
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
