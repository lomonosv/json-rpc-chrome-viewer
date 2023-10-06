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
  const { showCorsBadge, showRequestUrl } = useSettingsContext();
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
    <div className={ styles.requestWrapper }>
      <div
        className={ cn(styles.request, {
          [styles.isSelected]: item.uuid === selected?.uuid,
          [styles.error]: !!item.responseJSON?.error,
          [styles.responseNotParsed]: !item.responseJSON
        }) }
        onClick={ handleClick }
      >
        <div className={ styles.methodWrapper }>
          <div className={ styles.methodContainer }>
            <div
              className={ styles.method }
              title={ item.requestJSON.method }
            >
              { item.requestJSON.method }
              <Button
                title="Resend Request"
                onClick={ handleResendButtonClick }
              >
                <Icon type={ IconType.Update }></Icon>
              </Button>
            </div>
            { showRequestUrl && (
              <div
                className={ cn(styles.url, {
                  [styles.isCors]: item.isCors && showCorsBadge
                }) }
              >
                <span>{ item.request.url }</span>
              </div>
            ) }
          </div>
        </div>
        <div className={ styles.sizeTime }>
          <div>
            { Math.ceil(item.response.content.size) }
          </div>
          <div>
            { Math.ceil(item.time) }
          </div>
        </div>
      </div>
      <EditRequestModal
        isVisible={ isEditRequestModalVisible }
        item={ item }
        close={ hideEditRequestModal }
      />
    </div>
  );
};

export default Request;
