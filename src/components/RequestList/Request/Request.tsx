import React, { useEffect, useRef, useState } from 'react';
import cn from 'classnames';
import { useRequestContext } from '~/logic/HTTPArchive/HttpArchiveContext';
import { useSettingsContext } from '~/logic/SettingsContext/SettingsContext';
import useEffectiveViewMode from '~/logic/common/useEffectiveViewMode';
import { ViewMode } from '~/logic/SettingsContext/ViewMode';
import { useInterceptorContext } from '~/logic/Interceptor/InterceptorContext';
import useEditRequestModal from './EditRequestModal/useEditRequestModal';
import Button from '~/components/common/Button';
import CopyButton from '~/components/common/CopyButton';
import Icon, { IconType } from '~/components/common/Icon';
import Waterfall from './Waterfall';
import { getRequestLabel } from '~/logic/HTTPArchive/filters';
import { SortField } from '~/logic/HTTPArchive/SortField';
import {
  Slowness, formatSize, getErrorSummary, getRequestError, getSlowness, getStatusTone
} from '~/logic/HTTPArchive/summary';
import { ResizableColumn, getColumnWidthStyle } from '../columns';
import useVisibleColumns from '../useVisibleColumns';
import { ITimeline } from '../timeline';
import { IRequest } from '~/logic/HTTPArchive/IRequest';
import styles from './request.scss';

const rowStaggerMs = 18;
const maxStaggeredRows = 10;

interface IComponentProps {
  item: IRequest,
  timeline: ITimeline,
  now: number,
  revealIndex?: number,
}

const Request = ({ item, timeline, now, revealIndex }: IComponentProps) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const { selected, setSelected, clearSelection } = useRequestContext();
  const isSelected = item.uuid === selected?.uuid;
  const {
    showCorsBadge,
    showWebsocketBadge,
    showRequestUrl: showRequestUrlSetting,
    compactRows
  } = useSettingsContext();
  const showRequestUrl = showRequestUrlSetting && !compactRows;
  const isAccordionView = useEffectiveViewMode() === ViewMode.Accordion;
  const visibleColumns = useVisibleColumns();
  const isDimmed = isAccordionView && !!selected && !isSelected;
  // Resend fires from the inspected page and interceptor rules patch the page's
  // fetch, so neither can act on a call the server made: its url may not even
  // be reachable from the browser.
  const isReplayable = !item.isWebSocket && !item.isPending && !item.isServerSide;
  const isAccordionSelected = isAccordionView && isSelected;
  const isRevealing = typeof revealIndex === 'number';
  const requestError = getRequestError(item);
  // Warning rows already colour their meta cells; two tints would race on source order.
  const slowness = item.isWarning ? Slowness.Normal : getSlowness(item);
  const {
    EditRequestModal,
    isEditRequestModalVisible,
    showEditRequestModal,
    hideEditRequestModal
  } = useEditRequestModal();
  const { addRuleFromRequest } = useInterceptorContext();
  const [isRuleAdded, setIsRuleAdded] = useState<boolean>(false);

  useEffect(() => {
    if (isSelected) {
      rowRef.current?.scrollIntoView({ block: 'nearest' });
    }
  }, [isSelected]);

  const renderCellContent = (field: ResizableColumn) => {
    if (field === SortField.Waterfall) {
      return (
        <Waterfall
          item={ item }
          timeline={ timeline }
          now={ now }
        />
      );
    }

    if (item.isPending) {
      return field === SortField.Status
        ? <span className={ cn(styles.statusPill, styles.isPending) }>Pending</span>
        : '';
    }

    if (item.isWebSocket) {
      return '';
    }

    if (field === SortField.Status) {
      const status = Math.ceil(item.response.status);

      return <span className={ cn(styles.statusPill, styles[getStatusTone(status)]) }>{ status }</span>;
    }

    if (field === SortField.Size) {
      // Display only - sorting still compares the raw byte count.
      return formatSize(item.response.content.size);
    }

    return Math.ceil(item.time);
  };

  const renderError = () => (
    <div
      className={ styles.errorLine }
      title={ `${ getErrorSummary(item) }\n${ item.request.url }` }
    >
      { requestError.code && <span className={ styles.errorCode }>{ requestError.code }</span> }
      <span className={ styles.errorMessage }>{ requestError.message }</span>
    </div>
  );

  const handleClick = () => {
    if (isAccordionView && isSelected) {
      clearSelection();

      return;
    }

    setSelected(item);
  };

  const handleResendButtonClick = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    showEditRequestModal();
  };

  const handleAddInterceptorRuleClick = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    addRuleFromRequest(item);
    setIsRuleAdded(true);

    setTimeout(() => {
      setIsRuleAdded(false);
    }, 700);
  };

  return (
    <div
      ref={ rowRef }
      className={ cn(styles.requestWrapper, {
        [styles.isRevealing]: isRevealing,
        [styles.isServerRow]: item.isServerSide,
        [styles.isMockRow]: item.isIntercepted,
        [styles.isSelected]: isSelected,
        [styles.isCompact]: compactRows,
        [styles.isAccordionSelected]: isAccordionSelected,
        [styles.isDimmed]: isDimmed,
        [styles.isPendingRow]: item.isPending && !isDimmed,
        [styles.error]: item.isError,
        [styles.responseNotParsed]: item.isWarning
      }) }
      style={ isRevealing
        ? { animationDelay: `${ Math.min(revealIndex, maxStaggeredRows) * rowStaggerMs }ms` }
        : undefined }
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
          { item.isIntercepted && (
            <div className={ cn(styles.badge, styles.isIntercepted) } />
          ) }
          { item.isServerSide && (
            <div
              className={ cn(styles.badge, styles.isServerSide) }
              title="Called by the server while answering a request, not by the browser"
            />
          ) }
          <span className={ styles.methodLabel } data-method-label>{ getRequestLabel(item) }</span>
          { compactRows && requestError && renderError() }
          <div
            className={ styles.rowActions }
            onClick={ (e) => e.stopPropagation() }
          >
            <CopyButton
              text={ getRequestLabel(item) }
              hint="Copy method name"
              className={ styles.rowActionButton }
            />
            { isReplayable && (
              <Button
                title="Resend Request"
                onClick={ handleResendButtonClick }
                className={ styles.rowActionButton }
              >
                <Icon type={ IconType.Update }></Icon>
              </Button>
            ) }
            { isReplayable && (
              <Button
                title="Add interceptor rule from this response"
                onClick={ handleAddInterceptorRuleClick }
                className={ cn(styles.rowActionButton, { [styles.isRuleAdded]: isRuleAdded }) }
              >
                <Icon type={ IconType.Interceptor }></Icon>
              </Button>
            ) }
          </div>
        </div>
        { (showRequestUrl || (requestError && !compactRows)) && (
          <div className={ styles.urlRow }>
            <div className={ cn(styles.badge, { [styles.isCors]: showRequestUrl && item.isCors && showCorsBadge }) } />
            <div
              className={ cn(styles.badge, {
                [styles.isWebsocket]: showRequestUrl && item.isWebSocket && showWebsocketBadge
              }) }
            />
            { showRequestUrl && item.isWebSocket && (
              <div
                className={ cn(styles.badgeMessageType, {
                  [styles.income]: item.websocketMessageType === 'income',
                  [styles.outcome]: item.websocketMessageType === 'outcome'
                }) }
              />
            ) }
            { requestError ? (
              renderError()
            ) : (
              <div className={ styles.url }>
                <span>{ item.request.url }</span>
              </div>
            ) }
          </div>
        ) }
      </div>
      <div className={ styles.meta }>
        { visibleColumns.map((field) => (
          <div
            key={ field }
            className={ cn({
              [styles.waterfallCell]: field === SortField.Waterfall,
              [styles.isSlow]: field === SortField.Time && slowness === Slowness.Slow,
              [styles.isVerySlow]: field === SortField.Time && slowness === Slowness.VerySlow
            }) }
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
