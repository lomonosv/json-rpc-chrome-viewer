import React from 'react';
import cn from 'classnames';
import { useRequestContext } from '~/logic/HTTPArchive/HttpArchiveContext';
import { useSettingsContext } from '~/logic/SettingsContext/SettingsContext';
import useEditRequestModal from './EditRequestModal/useEditRequestModal';
import Button from '~/components/common/Button';
import Icon, { IconType } from '~/components/common/Icon';
import { IRequest } from '~/logic/HTTPArchive/IRequest';
import styles from './request.scss';

const Request = ({ item }: { item: IRequest }) => {
  const { selected, setSelected } = useRequestContext();
  const { showCorsBadge, showWebsocketBadge, showRequestUrl } = useSettingsContext();
  const {
    EditRequestModal,
    isEditRequestModalVisible,
    showEditRequestModal,
    hideEditRequestModal
  } = useEditRequestModal();

  const handleClick = () => {
    setSelected(item);
    throw new Error('Testing error handling');
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
          title={ item.isWebSocket ? item.websocketJSON.method || item.websocketJSON.id : item.requestJSON.method }
        >
          { !showRequestUrl && item.isWebSocket && (
            <div
              className={ cn(styles.badgeMessageType, {
                [styles.income]: item.websocketMessageType === 'income',
                [styles.outcome]: item.websocketMessageType === 'outcome'
              }) }
            />
          ) }
          { item.isWebSocket ? item.websocketJSON.method || item.websocketJSON.id : item.requestJSON.method }
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
          <>
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
          </>
        ) }
      </div>
      <div className={ styles.meta }>
        <div>
          { item.isWebSocket ? '' : Math.ceil(item.response.status) }
        </div>
        <div>
          { item.isWebSocket ? '' : Math.ceil(item.response.content.size) }
        </div>
        <div>
          { item.isWebSocket ? '' : Math.ceil(item.time) }
        </div>
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
