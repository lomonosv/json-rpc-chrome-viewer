import React, { ChangeEventHandler } from 'react';
import Header from '~/components/common/Header';
import Button from '~/components/common/Button';
import Icon, { IconType } from '~/components/common/Icon';
import Portal from '~/components/common/Portal';
import Input, { Type } from '~/components/common/Input';
import { useInterceptorContext } from '~/logic/Interceptor/InterceptorContext';
import InterceptorRule from './InterceptorRule';
import styles from './interceptor.scss';

interface IComponentProps {
  onClose: () => void,
}

const Interceptor = ({ onClose }: IComponentProps) => {
  const {
    rules,
    isEnabled,
    setIsEnabled,
    addRule,
    updateRule,
    removeRule
  } = useInterceptorContext();

  const handleIsEnabledChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setIsEnabled(e.target.checked);
  };

  return (
    <Portal>
      <div className={ styles.interceptorWrapper }>
        <Header>
          <strong className={ styles.headerTitle }>JSON-RPC Response Interceptor</strong>
          <Button
            className={ styles.closeButton }
            onClick={ onClose }
          >
            <Icon type={ IconType.Close } />
          </Button>
        </Header>
        <div className={ styles.interceptorToolbar }>
          <Input
            name="interceptorEnabled"
            label="Enable interception"
            type={ Type.Checkbox }
            checked={ isEnabled }
            onChange={ handleIsEnabledChange }
          />
          <Button
            className={ styles.addButton }
            onClick={ addRule }
          >
            Add rule
          </Button>
        </div>
        <div className={ styles.hint }>
          Matched calls are answered locally and never reach the network - in this tab only, and
          only while DevTools is open. <code>fetch</code> only: XHR, WebSocket and worker requests
          are unaffected.
        </div>
        <div className={ styles.interceptorContainer }>
          { !rules.length && (
            <div className={ styles.empty }>
              No rules yet. Add one to start mocking responses.
            </div>
          ) }
          { rules.map((rule) => (
            <InterceptorRule
              key={ rule.id }
              rule={ rule }
              onChange={ updateRule }
              onRemove={ removeRule }
            />
          )) }
        </div>
      </div>
    </Portal>
  );
};

export default Interceptor;
