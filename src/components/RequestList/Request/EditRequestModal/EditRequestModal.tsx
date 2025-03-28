import React, { useState } from 'react';
import cn from 'classnames';
import Modal from '~/components/common/Modal';
import Button from '~/components/common/Button';
import Icon, { IconType } from '~/components/common/Icon';
import { JSONValue, IRequest, IJSONObject } from '~/logic/HTTPArchive/IRequest';
import styles from './editRequestModal.scss';
import JsonViewer from '~/components/common/JsonViewer';
import { ExpandTreeState } from '~/components/common/JsonViewer/ExpandTreeState';

interface IProps {
  isVisible: boolean,
  item: IRequest,
  close: () => void,
}

const EditRequestModal = ({ isVisible, item, close }: IProps) => {
  const [params, setParams] = useState<JSONValue>(item.requestJSON.params);

  const getCurrentTab = async () => {
    const queryOptions = { active: true, lastFocusedWindow: true };
    // `tab` will either be a `tabs.Tab` instance or `undefined`.
    const [tab] = await chrome.tabs.query(queryOptions);
    return tab;
  };

  const resend = async (e) => {
    e.stopPropagation();
    const tab = await getCurrentTab();

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (item: IRequest, params: JSONValue & {
        headers?: IJSONObject,
        payload?: IJSONObject,
      }) => {
        const { url, method, headers, postData: { text: body } } = item.request;
        const json = JSON.parse(body);

        fetch(url, {
          method,
          headers: headers.filter(
            ({ name }) => !name.startsWith(':')
          ).reduce((acc, header: { name: string, value: string }) => ({
            ...acc,
            [header.name]: header.value
          }), {}),
          body: JSON.stringify({
            ...json,
            params: {
              ...json.params,
              headers: params.headers,
              payload: params.payload
            }
          })
        }).then((response) => response.json());
      },
      args: [item, params]
    });

    close();
  };

  const handleEditParams = ({ updated_src } : { updated_src: JSONValue }) => {
    setParams(updated_src);
  };

  const header = (
    <div className={ styles.header }>
      <span>
        { `Resend "${ item.requestJSON.method }" request` }
      </span>
      <Button onClick={ close }>
        <Icon type={ IconType.Close } />
      </Button>
    </div>
  );

  const footer = (
    <>
      <Button
        className={ cn(styles.button, styles.cancel) }
        onClick={ close }
      >
        Cancel
      </Button>
      <Button
        className={ styles.button }
        onClick={ resend }
      >
        Resend
      </Button>
    </>
  );

  return (
    <Modal
      isVisible={ isVisible }
      className={ styles.editRequestModal }
      close={ close }
      header={ header }
      footer={ footer }
    >
      <JsonViewer
        src={ item.requestJSON.params || {} }
        expandTreeState={ ExpandTreeState.Expanded }
        onEdit={ handleEditParams }
      />
    </Modal>
  );
};

export default EditRequestModal;
