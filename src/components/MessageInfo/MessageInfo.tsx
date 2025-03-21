import React, { useEffect, useState } from 'react';
import { useRequestContext } from '~/logic/HTTPArchive/HttpArchiveContext';
import { useSettingsContext } from '~/logic/SettingsContext/SettingsContext';
import { IRequest } from '~/logic/HTTPArchive/IRequest';
import Button from '~/components/common/Button';
import Icon, { IconType } from '~/components/common/Icon';
import CopyButton from '~/components/common/CopyButton';
import ExpandButton from '~/components/common/ExpandButton';
import Header from '~/components/common/Header';
import JsonViewer from '~/components/common/JsonViewer';
import { ExpandTreeState } from '~/components/common/JsonViewer/ExpandTreeState';
import styles from './messageInfo.scss';

const MessageInfo = () => {
  const { selected, clearSelection } = useRequestContext();
  const { expandedWebsocketMessagesState } = useSettingsContext();
  const [expandTreeStateValue, setExpandTreeStateValue] = useState<ExpandTreeState>(expandedWebsocketMessagesState);
  const [selectedRequest, setSelectedRequest] = useState<IRequest>(selected);

  useEffect(() => {
    setExpandTreeStateValue(expandedWebsocketMessagesState);
    setSelectedRequest(selected);
  }, [expandedWebsocketMessagesState, selected]);

  const json = selectedRequest.websocketJSON || {};

  return (
    <div className={ styles.messageInfoWrapper }>
      <Header className={ styles.messageInfoHeader }>
        <div className={ styles.messageInfoHeaderLeftSide }>
          <Button
            onClick={ clearSelection }
            className={ styles.closeButton }
            title="Close"
          >
            <Icon type={ IconType.Close } />
          </Button>
          <ExpandButton
            className={ styles.expandButton }
            expandedState={ expandTreeStateValue }
            onChangeState={ setExpandTreeStateValue }
          />
          <span>Websocket Message</span>
        </div>
        <CopyButton text={ JSON.stringify(json, null, 2) } />
      </Header>
      <div className={ styles.messageInfoContainer }>
        <JsonViewer
          src={ json }
          expandTreeState={ expandTreeStateValue }
        />
      </div>
    </div>
  );
};

export default MessageInfo;
