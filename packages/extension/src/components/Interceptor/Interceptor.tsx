import React, { ChangeEventHandler } from 'react';
import cn from 'classnames';
import Header from '~/components/common/Header';
import Button from '~/components/common/Button';
import Icon, { IconType } from '~/components/common/Icon';
import Portal from '~/components/common/Portal';
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

const pluralRules = (count: number) => `${ count } rule${ count === 1 ? '' : 's' }`;

const getStatus = (isEnabled: boolean, activeCount: number): { title: string, text: string } => {
  if (!isEnabled) {
    return {
      title: 'Interception is off',
      text: 'Every request goes to the network as usual.'
    };
  }

  if (!activeCount) {
    return {
      title: 'On — no rule is ready yet',
      text: 'Give a rule a method and a valid JSON body, and it starts answering.'
    };
  }

  return {
    title: `Armed — ${ pluralRules(activeCount) } answering locally`,
    text: 'Matching calls are answered here and never reach the network.'
  };
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
  const status = getStatus(isEnabled, activeCount);

  const handleIsEnabledChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setIsEnabled(e.target.checked);
  };

  return (
    <Portal>
      <div className={ styles.interceptorWrapper }>
        <Header className={ styles.pageHeader }>
          <span className={ styles.pageTitle }>
            <span className={ styles.titleMark } aria-hidden="true">
              <Icon type={ IconType.Interceptor } />
            </span>
            Response Interceptor
            { !!rules.length && <span className={ styles.ruleCount }>{ pluralRules(rules.length) }</span> }
          </span>
          <span className={ styles.pageActions }>
            <button type="button" className={ `${ styles.primaryButton } ${ styles.addButton }` } onClick={ addRule }>
              Add rule
            </button>
            <Button
              className={ styles.closeButton }
              title="Close"
              onClick={ onClose }
            >
              <Icon type={ IconType.Close } />
            </Button>
          </span>
        </Header>
        <div className={ styles.interceptorContainer }>
          <div className={ styles.interceptorContent }>
            <section
              className={ cn(styles.statusCard, {
                [styles.isArmed]: isArmed,
                [styles.isIncomplete]: isIncomplete
              }) }
            >
              <label className={ styles.switch }>
                <input
                  type="checkbox"
                  name="interceptorEnabled"
                  checked={ isEnabled }
                  onChange={ handleIsEnabledChange }
                />
                <span className={ styles.switchTrack } aria-hidden="true" />
                <span className={ styles.visuallyHidden }>Enable interception</span>
              </label>
              <div className={ styles.statusCopy }>
                <strong className={ styles.statusTitle }>
                  <span className={ styles.statusDot } aria-hidden="true" />
                  { status.title }
                </strong>
                <span className={ styles.statusText }>{ status.text }</span>
              </div>
            </section>

            <p className={ styles.hint }>
              <span className={ styles.hintIcon } aria-hidden="true">i</span>
              <span>
                Matched calls are answered locally and never reach the network - in this tab only, and
                only while DevTools is open. <code>fetch</code> only: XHR, WebSocket and worker
                requests are unaffected.
              </span>
            </p>

            { !rules.length ? (
              <div className={ styles.empty }>
                <span className={ styles.emptyMark } aria-hidden="true">
                  <Icon type={ IconType.Interceptor } />
                </span>
                <strong className={ styles.emptyTitle }>No rules yet</strong>
                <span className={ styles.emptyText }>
                  A rule matches a JSON-RPC method and answers it with a response of your own.
                  Or use the mock button on any row to start from its real response.
                </span>
                <button
                  type="button"
                  className={ `${ styles.primaryButton } ${ styles.addButton }` }
                  onClick={ addRule }
                >
                  Add your first rule
                </button>
              </div>
            ) : (
              <div className={ styles.rules }>
                { rules.map((rule) => (
                  <InterceptorRule
                    key={ rule.id }
                    rule={ rule }
                    isDisabled={ !isEnabled }
                    onChange={ updateRule }
                    onRemove={ removeRule }
                  />
                )) }
              </div>
            ) }
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default Interceptor;
