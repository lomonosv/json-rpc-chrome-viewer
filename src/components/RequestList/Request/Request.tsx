import React from 'react';
import cn from 'classnames';
import { useRequestContext } from '~/logic/HTTPArchive/HttpArchiveContext';
import { useSettingsContext } from '~/logic/SettingsContext/SettingsContext';
import useEditRequestModal from './EditRequestModal/useEditRequestModal';
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
            <span onClick={ showEditRequestModal }>Resend</span>
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
