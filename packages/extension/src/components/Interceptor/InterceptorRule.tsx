import React, { ChangeEventHandler, useState } from 'react';
import cn from 'classnames';
import Button from '~/components/common/Button';
import Icon, { IconType } from '~/components/common/Icon';
import Input from '~/components/common/Input';
import JsonTextarea from '~/components/common/JsonTextarea';
import {
  IInterceptorRule,
  InterceptorResponseType,
  interceptorResponseTypeOptions
} from '~/logic/Interceptor/IInterceptorRule';
import { isValidRuleBody } from '~/logic/Interceptor/rules';
import styles from './interceptor.scss';

interface IComponentProps {
  rule: IInterceptorRule,
  isDisabled: boolean,
  onChange: (id: string, patch: Partial<IInterceptorRule>) => void,
  onRemove: (id: string) => void,
}

const toNumber = (value: string, fallback: number): number => {
  const parsed = parseInt(value, 10);

  return Number.isNaN(parsed) ? fallback : parsed;
};

const getInactiveReason = (rule: IInterceptorRule, isBodyValid: boolean, isDisabled: boolean): string => {
  if (!rule.isEnabled || isDisabled) {
    return '';
  }

  if (!rule.method) {
    return 'Needs a method';
  }

  return isBodyValid ? '' : 'Invalid JSON';
};

const InterceptorRule = ({ rule, isDisabled, onChange, onRemove }: IComponentProps) => {
  // Initial value only, so toggling the rule never fights a manual expand.
  const [isExpanded, setIsExpanded] = useState<boolean>(rule.isEnabled);
  const isBodyValid = isValidRuleBody(rule.body);
  const inactiveReason = getInactiveReason(rule, isBodyValid, isDisabled);
  const areFieldsDisabled = isDisabled || !rule.isEnabled;
  const isError = rule.responseType === InterceptorResponseType.Error;
  const fieldId = (field: string) => `${ rule.id }-${ field }`;

  const handleIsEnabledChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    onChange(rule.id, { isEnabled: e.target.checked });
  };

  const handleMethodChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    onChange(rule.id, { method: e.target.value });
  };

  const handleUrlChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    onChange(rule.id, { url: e.target.value });
  };

  const handleResponseTypeChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    onChange(rule.id, { responseType: e.target.value as InterceptorResponseType });
  };

  const handleStatusChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    onChange(rule.id, { status: toNumber(e.target.value, 200) });
  };

  const handleDelayChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    onChange(rule.id, { delay: toNumber(e.target.value, 0) });
  };

  const handleBodyChange: ChangeEventHandler<HTMLTextAreaElement> = (e) => {
    onChange(rule.id, { body: e.target.value });
  };

  return (
    <article
      className={ cn(styles.rule, {
        [styles.isDisabled]: !rule.isEnabled,
        [styles.isInactive]: isDisabled,
        [styles.isLive]: !isDisabled && rule.isEnabled && !inactiveReason,
        [styles.isExpanded]: isExpanded
      }) }
    >
      <div className={ styles.ruleHeader }>
        <label
          className={ cn(styles.switch, styles.isSmall) }
          title={ rule.isEnabled ? 'Disable rule' : 'Enable rule' }
        >
          <input
            type="checkbox"
            name={ fieldId('isEnabled') }
            checked={ rule.isEnabled }
            disabled={ isDisabled }
            onChange={ handleIsEnabledChange }
          />
          <span className={ styles.switchTrack } aria-hidden="true" />
          <span className={ styles.visuallyHidden }>Enable rule</span>
        </label>
        <Button
          className={ styles.ruleToggle }
          title={ isExpanded ? 'Collapse rule' : 'Expand rule' }
          onClick={ () => setIsExpanded(!isExpanded) }
        >
          <span className={ cn(styles.ruleTitle, { [styles.isUntitled]: !rule.method }) }>
            { rule.method || 'Untitled rule' }
          </span>
          { !!rule.url && <span className={ styles.ruleUrl }>{ rule.url }</span> }
          <span className={ styles.ruleMeta }>
            { !!inactiveReason && (
              <span className={ cn(styles.pill, styles.isWarning) }>{ inactiveReason }</span>
            ) }
            <span className={ cn(styles.pill, isError ? styles.isError : styles.isResult) }>
              { rule.responseType }
            </span>
            <span className={ styles.pill }>{ rule.status }</span>
            { rule.delay > 0 && <span className={ styles.pill }>{ rule.delay } ms</span> }
          </span>
          <span className={ cn(styles.chevron, { [styles.isOpen]: isExpanded }) } aria-hidden="true" />
        </Button>
        <Button
          className={ styles.removeButton }
          title="Remove rule"
          onClick={ () => onRemove(rule.id) }
        >
          <Icon type={ IconType.Close } />
        </Button>
      </div>

      { isExpanded && (
        <div className={ styles.ruleBody }>
          <div className={ styles.ruleSettings }>
            <div className={ styles.field }>
              <span className={ styles.fieldLabel }>Method</span>
              <Input
                wrapperClassName={ styles.inputGrow }
                name={ fieldId('method') }
                placeholder="getUser"
                className={ styles.patternInput }
                value={ rule.method }
                isDisabled={ areFieldsDisabled }
                onChange={ handleMethodChange }
              />
              <span className={ styles.fieldHint }>Exact name, or <code>*</code> as a wildcard</span>
            </div>
            <div className={ styles.field }>
              <span className={ styles.fieldLabel }>URL contains</span>
              <Input
                wrapperClassName={ styles.inputGrow }
                name={ fieldId('url') }
                placeholder="any url"
                className={ styles.patternInput }
                value={ rule.url }
                isDisabled={ areFieldsDisabled }
                onChange={ handleUrlChange }
              />
              <span className={ styles.fieldHint }>Optional - narrows the rule to one endpoint</span>
            </div>
            <div className={ styles.field }>
              <span className={ styles.fieldLabel }>Respond with</span>
              <div className={ styles.segmented } role="radiogroup" aria-label="Respond with">
                { interceptorResponseTypeOptions.map((option) => (
                  <label
                    key={ option.key }
                    className={ cn(styles.segment, {
                      [styles.isChecked]: rule.responseType === option.key,
                      [styles.isErrorSegment]: option.key === InterceptorResponseType.Error
                    }) }
                  >
                    <input
                      type="radio"
                      name={ fieldId('responseType') }
                      value={ option.key }
                      checked={ rule.responseType === option.key }
                      disabled={ areFieldsDisabled }
                      onChange={ handleResponseTypeChange }
                    />
                    { option.value }
                  </label>
                )) }
              </div>
            </div>
            <div className={ styles.fieldPair }>
              <div className={ styles.field }>
                <span className={ styles.fieldLabel }>HTTP status</span>
                <Input
                  name={ fieldId('status') }
                  title="Clamped to 200-599"
                  className={ styles.numberInput }
                  value={ String(rule.status) }
                  isDisabled={ areFieldsDisabled }
                  onChange={ handleStatusChange }
                />
              </div>
              <div className={ styles.field }>
                <span className={ styles.fieldLabel }>Delay</span>
                <span className={ styles.inputWithSuffix }>
                  <Input
                    name={ fieldId('delay') }
                    className={ styles.numberInput }
                    value={ String(rule.delay) }
                    isDisabled={ areFieldsDisabled }
                    onChange={ handleDelayChange }
                  />
                  <span className={ styles.fieldSuffix }>ms</span>
                </span>
              </div>
            </div>
          </div>

          <div className={ cn(styles.field, styles.bodyField) }>
            <span className={ styles.fieldLabel }>
              { isError ? 'Error object' : 'Result value' }
            </span>
            <JsonTextarea
              name={ fieldId('body') }
              value={ rule.body }
              isDisabled={ areFieldsDisabled }
              isInvalid={ !isBodyValid }
              onChange={ handleBodyChange }
            />
            <span className={ cn(styles.fieldHint, { [styles.isInvalidHint]: !isBodyValid }) }>
              { isBodyValid
                ? `JSON placed under "${ rule.responseType }" in the JSON-RPC response`
                : 'Not valid JSON - this rule stays inactive until it parses' }
            </span>
          </div>
        </div>
      ) }
    </article>
  );
};

export default InterceptorRule;
