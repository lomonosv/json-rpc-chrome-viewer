import React, { ChangeEventHandler } from 'react';
import cn from 'classnames';
import Header from '~/components/common/Header';
import Button from '~/components/common/Button';
import Icon, { IconType } from '~/components/common/Icon';
import Portal from '~/components/common/Portal';
import Input, { Type } from '~/components/common/Input';
import { useInterceptorContext } from '~/logic/Interceptor/InterceptorContext';
import { IInterceptorRule } from '~/logic/Interceptor/IInterceptorRule';
import { isValidRuleBody } from '~/logic/Interceptor/rules';
import InterceptorRule from './InterceptorRule';
import styles from './interceptor.scss';

interface IComponentProps {
  onClose: () => void,
}

const isRuleActive = (rule: IInterceptorRule): boolean => (
  rule.isEnabled && !!rule.method && isValidRuleBody(rule.body)
);

const getStatusText = (isEnabled: boolean, activeCount: number): string => {
  if (!isEnabled) {
    return 'Off - every request goes to the network as usual.';
  }

  if (!activeCount) {
    return 'On, but no rule is ready to match yet.';
  }

  return `On - ${ activeCount } rule${ activeCount > 1 ? 's' : '' } will answer locally.`;
};

const Interceptor = ({ onClose }: IComponentProps) => {
  const {
    rules,
    isEnabled,
    setIsEnabled,
    addRule,
    updateRule,
    removeRule
  } = useInterceptorContext();

  const activeCount = rules.filter(isRuleActive).length;
  const isArmed = isEnabled && activeCount > 0;
  const isIncomplete = isEnabled && !activeCount;

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
        <div className={ styles.interceptorContainer }>
          <div className={ styles.interceptorContent }>
            <div
              className={ cn(styles.statusBar, {
                [styles.isArmed]: isArmed,
                [styles.isIncomplete]: isIncomplete
              }) }
            >
              <Input
                name="interceptorEnabled"
                label="Enable interception"
                wrapperClassName={ styles.statusToggle }
                type={ Type.Checkbox }
                checked={ isEnabled }
                onChange={ handleIsEnabledChange }
              />
              <span className={ styles.statusText }>
                { getStatusText(isEnabled, activeCount) }
              </span>
              { !!rules.length && (
                <Button
                  className={ styles.addButton }
                  onClick={ addRule }
                >
                  Add rule
                </Button>
              ) }
            </div>
            <p className={ styles.hint }>
              Matched calls are answered locally and never reach the network - in this tab only, and
              only while DevTools is open. <code>fetch</code> only: XHR, WebSocket and worker
              requests are unaffected.
            </p>
            { !rules.length ? (
              <div className={ styles.empty }>
                <strong className={ styles.emptyTitle }>No rules yet</strong>
                <span className={ styles.emptyText }>
                  A rule matches a JSON-RPC method and answers it with a response of your own.
                </span>
                <Button
                  className={ cn(styles.addButton, styles.emptyButton) }
                  onClick={ addRule }
                >
                  Add your first rule
                </Button>
              </div>
            ) : rules.map((rule) => (
              <InterceptorRule
                key={ rule.id }
                rule={ rule }
                isDisabled={ !isEnabled }
                onChange={ updateRule }
                onRemove={ removeRule }
              />
            )) }
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default Interceptor;
