import React, { useEffect, useRef } from 'react';
import cn from 'classnames';
import { useRequestContext } from '~/logic/HTTPArchive/HttpArchiveContext';
import { useSettingsContext } from '~/logic/SettingsContext/SettingsContext';
import { useCacheContext } from '~/logic/CacheContext/CacheContext';
import useEditRequestModal from './EditRequestModal/useEditRequestModal';
import Button from '~/components/common/Button';
import CopyButton from '~/components/common/CopyButton';
import Icon, { IconType } from '~/components/common/Icon';
import Waterfall from './Waterfall';
import { getRequestLabel } from '~/logic/HTTPArchive/filters';
import { SortField } from '~/logic/HTTPArchive/SortField';
import { ResizableColumn, getColumnWidthStyle } from '../columns';
import { IRequest } from '~/logic/HTTPArchive/IRequest';
import styles from './request.scss';

interface IComponentProps {
  item: IRequest,
  timelineStart: number,
  timelineEnd: number,
}

const Request = ({ item, timelineStart, timelineEnd }: IComponentProps) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const { selected, setSelected } = useRequestContext();
  const isSelected = item.uuid === selected?.uuid;
  const { columnOrder } = useCacheContext();
  const {
    showCorsBadge,
    showWebsocketBadge,
    showRequestUrl,
    showWaterfallColumn,
    showStatusColumn,
    showSizeColumn,
    showTimeColumn
  } = useSettingsContext();
  const {
    EditRequestModal,
    isEditRequestModalVisible,
    showEditRequestModal,
    hideEditRequestModal
  } = useEditRequestModal();

  useEffect(() => {
    if (isSelected) {
      rowRef.current?.scrollIntoView({ block: 'nearest' });
    }
  }, [isSelected]);

  const isColumnVisible: Record<ResizableColumn, boolean> = {
    [SortField.Waterfall]: showWaterfallColumn,
    [SortField.Status]: showStatusColumn,
    [SortField.Size]: showSizeColumn,
    [SortField.Time]: showTimeColumn
  };

  const visibleColumns = columnOrder.filter((field) => isColumnVisible[field]);

  const renderCellContent = (field: ResizableColumn) => {
    if (field === SortField.Waterfall) {
      return (
        <Waterfall
          item={ item }
          timelineStart={ timelineStart }
          timelineEnd={ timelineEnd }
        />
      );
    }

    if (item.isWebSocket) {
      return '';
    }

    if (field === SortField.Status) {
      return Math.ceil(item.response.status);
    }

    if (field === SortField.Size) {
      return Math.ceil(item.response.content.size);
    }

    return Math.ceil(item.time);
  };

  const handleClick = () => {
    setSelected(item);
  };

  const handleResendButtonClick = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    showEditRequestModal();
  };

  return (
    <div
      ref={ rowRef }
      className={ cn(styles.requestWrapper, {
        [styles.isSelected]: isSelected,
        [styles.error]: item.isError,
        [styles.responseNotParsed]: item.isWarning
      }) }
      onClick={ handleClick }
    >
      <div className={ styles.methodWrapper }>
        <div
          className={ styles.method }
          title={ getRequestLabel(item) }
        >
          { !showRequestUrl && item.isWebSocket && (
            <div
              className={ cn(styles.badgeMessageType, {
                [styles.income]: item.websocketMessageType === 'income',
                [styles.outcome]: item.websocketMessageType === 'outcome'
              }) }
            />
          ) }
          { item.isMocked && (
            <div className={ cn(styles.badge, styles.isMocked) } />
          ) }
          <span className={ styles.methodLabel }>{ getRequestLabel(item) }</span>
          <div
            className={ styles.rowActions }
            onClick={ (e) => e.stopPropagation() }
          >
            <CopyButton
              text={ getRequestLabel(item) }
              hint="Copy method name"
              className={ styles.rowActionButton }
            />
            { !item.isWebSocket && (
              <Button
                title="Resend Request"
                onClick={ handleResendButtonClick }
                className={ styles.rowActionButton }
              >
                <Icon type={ IconType.Update }></Icon>
              </Button>
            ) }
          </div>
        </div>
        { showRequestUrl && (
          <div className={ styles.urlRow }>
            <div className={ cn(styles.badge, { [styles.isCors]: item.isCors && showCorsBadge }) } />
            <div className={ cn(styles.badge, { [styles.isWebsocket]: item.isWebSocket && showWebsocketBadge }) } />
            { item.isWebSocket && (
              <div
                className={ cn(styles.badgeMessageType, {
                  [styles.income]: item.websocketMessageType === 'income',
                  [styles.outcome]: item.websocketMessageType === 'outcome'
                }) }
              />
            ) }
            <div className={ styles.url }>
              <span>{ item.request.url }</span>
            </div>
          </div>
        ) }
      </div>
      <div className={ styles.meta }>
        { visibleColumns.map((field) => (
          <div
            key={ field }
            className={ cn({ [styles.waterfallCell]: field === SortField.Waterfall }) }
            style={ getColumnWidthStyle(field) }
          >
            { renderCellContent(field) }
          </div>
        )) }
      </div>
      { isEditRequestModalVisible && (
        <EditRequestModal
          isVisible={ isEditRequestModalVisible }
          item={ item }
          close={ hideEditRequestModal }
        />
      ) }
    </div>
  );
};

export default Request;
