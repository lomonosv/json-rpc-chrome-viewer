import React from 'react';
import Modal from '~/components/common/Modal';
import { IRequest } from '~/logic/HTTPArchive/IRequest';

interface IProps {
  isVisible: boolean,
  item: IRequest,
  close: () => void,
}

const EditRequestModal = ({ isVisible, item, close }: IProps) => {
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
      func: (item) => {
        const { url, method, headers, postData: { text: body } } = item.request;

        console.log('url', url);
        console.log('method', method);
        console.log('headers', headers.reduce((acc, header: { name: string, value: string }) => ({
          ...acc,
          [header.name]: header.value
        }), {}));
        console.log('body', body);

        fetch(url, {
          method,
          headers: headers.filter(
            ({ name }) => !name.startsWith(':')
          ).reduce((acc, header: { name: string, value: string }) => ({
            ...acc,
            [header.name]: header.value
          }), {}),
          body
        }).then((response) => response.json());
      },
      args: [item]
    });
  };

  return (
    <Modal
      isVisible={ isVisible }
      close={ close }
    >
      <button onClick={ resend }>RESEND</button>
    </Modal>
  );
};

export default EditRequestModal;
