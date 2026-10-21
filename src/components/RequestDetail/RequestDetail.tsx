import React, { useLayoutEffect, useRef, useState } from 'react';
import cn from 'classnames';
import { useRequestContext } from '~/logic/HTTPArchive/HttpArchiveContext';
import RequestInfo from '~/components/RequestInfo';
import ResponseInfo from '~/components/ResponseInfo';
import MessageInfo from '~/components/MessageInfo';
import styles from './requestDetail.scss';

const tabbedBelowHeight = 360;

enum DetailTab {
  Request = 'Request',
  Response = 'Response',
}

interface IComponentProps {
  isClosable?: boolean,
  isAlwaysTabbed?: boolean,
}

const RequestDetail = ({ isClosable = true, isAlwaysTabbed = false }: IComponentProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { selected } = useRequestContext();
  const [isShort, setIsShort] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<DetailTab>(DetailTab.Response);

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    const observer = new ResizeObserver(() => {
      setIsShort(wrapper.clientHeight < tabbedBelowHeight);
    });

    observer.observe(wrapper);

    return () => observer.disconnect();
  }, []);

  const isTabbed = isAlwaysTabbed || isShort;

  const renderTabs = () => (
    <span className={ styles.tabs } role="tablist">
      { Object.values(DetailTab).map((tab) => (
        <button
          key={ tab }
          type="button"
          role="tab"
          aria-selected={ tab === activeTab }
          className={ cn(styles.tab, { [styles.isActive]: tab === activeTab }) }
          onClick={ () => setActiveTab(tab) }
        >
          { tab }
        </button>
      )) }
    </span>
  );

  const renderContent = () => {
    if (selected.isWebSocket) {
      return <MessageInfo isClosable={ isClosable } />;
    }

    if (!isTabbed) {
      return (
        <>
          <RequestInfo isClosable={ isClosable } />
          <ResponseInfo />
        </>
      );
    }

    return activeTab === DetailTab.Request
      ? <RequestInfo label={ renderTabs() } isFill isClosable={ isClosable } />
      : <ResponseInfo label={ renderTabs() } isClosable={ isClosable } />;
  };

  return (
    <div ref={ wrapperRef } className={ styles.requestDetail }>
      { renderContent() }
    </div>
  );
};

export default RequestDetail;
