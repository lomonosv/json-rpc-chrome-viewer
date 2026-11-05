import React from 'react';
import cn from 'classnames';
import Button from '~/components/common/Button';
import Icon, { IconType } from '~/components/common/Icon';
import { useInterceptorContext } from '~/logic/Interceptor/InterceptorContext';
import Interceptor from './Interceptor';
import styles from './interceptor.scss';

const InterceptorButton = () => {
  const {
    isEnabled,
    activeRulesCount,
    isInterceptorVisible,
    showInterceptor,
    hideInterceptor
  } = useInterceptorContext();
  const isActive = isEnabled && !!activeRulesCount;

  const title = isActive
    ? `Responses are being mocked - ${ activeRulesCount } active rule${ activeRulesCount === 1 ? '' : 's' }`
    : 'Response interceptor';

  return (
    <>
      <Button
        onClick={ showInterceptor }
        className={ styles.interceptorButton }
        title={ title }
      >
        <Icon
          className={ cn(styles.interceptorIcon, { [styles.isActive]: isActive }) }
          type={ IconType.Interceptor }
        />
      </Button>
      { isInterceptorVisible && <Interceptor onClose={ hideInterceptor }/> }
    </>
  );
};

export default InterceptorButton;
