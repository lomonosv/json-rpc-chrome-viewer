import React from 'react';
import cn from 'classnames';
import { useRequestContext } from '~/logic/HTTPArchive/HttpArchiveContext';
import { useSettingsContext } from '~/logic/SettingsContext/SettingsContext';
import useEditRequestModal from './EditRequestModal/useEditRequestModal';
import Button from '~/components/common/Button';
import Icon, { IconType } from '~/components/common/Icon';
import Waterfall from './Waterfall';
import { getRequestLabel } from '~/logic/HTTPArchive/filters';
import { IRequest } from '~/logic/HTTPArchive/IRequest';
import styles from './request.scss';

interface IComponentProps {
  item: IRequest,
  timelineStart: number,
  timelineEnd: number,
}

const Request = ({ item, timelineStart, timelineEnd }: IComponentProps) => {
  const { selected, setSelected } = useRequestContext();
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

  const handleClick = () => {
    setSelected(item);
  };

  const handleResendButtonClick = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    showEditRequestModal();
  };

  return (
    <div
      className={ cn(styles.requestWrapper, {
        [styles.isSelected]: item.uuid === selected?.uuid,
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
          <span className={ styles.methodLabel }>{ getRequestLabel(item) }</span>
          { !item.isWebSocket && (
            <Button
              title="Resend Request"
              onClick={ handleResendButtonClick }
              className={ styles.resendRequestButton }
            >
              <Icon type={ IconType.Update }></Icon>
            </Button>
          ) }
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
        { showWaterfallColumn && (
          <div className={ styles.waterfallCell }>
            <Waterfall
              item={ item }
              timelineStart={ timelineStart }
              timelineEnd={ timelineEnd }
            />
          </div>
        ) }
        { showStatusColumn && (
          <div>
            { item.isWebSocket ? '' : Math.ceil(item.response.status) }
          </div>
        ) }
        { showSizeColumn && (
          <div>
            { item.isWebSocket ? '' : Math.ceil(item.response.content.size) }
          </div>
        ) }
        { showTimeColumn && (
          <div>
            { item.isWebSocket ? '' : Math.ceil(item.time) }
          </div>
        ) }
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
