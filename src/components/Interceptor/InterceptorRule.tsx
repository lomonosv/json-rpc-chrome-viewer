import React, { ChangeEventHandler } from 'react';
import cn from 'classnames';
import Button from '~/components/common/Button';
import Icon, { IconType } from '~/components/common/Icon';
import Input, { Type } from '~/components/common/Input';
import Select from '~/components/common/Select';
import {
  IInterceptorRule,
  InterceptorResponseType,
  interceptorResponseTypeOptions
} from '~/logic/Interceptor/IInterceptorRule';
import { isValidRuleBody } from '~/logic/Interceptor/rules';
import styles from './interceptor.scss';

interface IComponentProps {
  rule: IInterceptorRule,
  onChange: (id: string, patch: Partial<IInterceptorRule>) => void,
  onRemove: (id: string) => void,
}

const toNumber = (value: string, fallback: number): number => {
  const parsed = parseInt(value, 10);

  return Number.isNaN(parsed) ? fallback : parsed;
};

const InterceptorRule = ({ rule, onChange, onRemove }: IComponentProps) => {
  const isBodyValid = isValidRuleBody(rule.body);
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

  const handleResponseTypeChange: ChangeEventHandler<HTMLSelectElement> = (e) => {
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

  const handleRemoveClick = () => {
    onRemove(rule.id);
  };

  return (
    <div className={ cn(styles.rule, { [styles.isDisabled]: !rule.isEnabled }) }>
      <div className={ styles.ruleRow }>
        <div className={ styles.ruleConfiguration }>
          <Input
            name={ fieldId('isEnabled') }
            label="Enabled"
            wrapperClassName={ styles.ruleField }
            type={ Type.Checkbox }
            checked={ rule.isEnabled }
            onChange={ handleIsEnabledChange }
          />
          <div className={ cn(styles.ruleField, styles.ruleFieldWide) }>
            <span className={ styles.fieldLabel }>Method</span>
            <Input
              wrapperClassName={ styles.inputGrow }
              name={ fieldId('method') }
              placeholder="getUser or get*"
              className={ styles.patternInput }
              value={ rule.method }
              onChange={ handleMethodChange }
            />
          </div>
          <div className={ cn(styles.ruleField, styles.ruleFieldWide) }>
            <span className={ styles.fieldLabel }>URL contains</span>
            <Input
              wrapperClassName={ styles.inputGrow }
              name={ fieldId('url') }
              placeholder="any url"
              className={ styles.patternInput }
              value={ rule.url }
              onChange={ handleUrlChange }
            />
          </div>
          <div className={ styles.ruleField }>
            <span className={ styles.fieldLabel }>Respond with</span>
            <Select<InterceptorResponseType>
              className={ styles.responseTypeSelect }
              name={ fieldId('responseType') }
              options={ interceptorResponseTypeOptions }
              value={ rule.responseType }
              onChange={ handleResponseTypeChange }
            />
          </div>
          <div className={ styles.ruleField }>
            <span className={ styles.fieldLabel }>Status</span>
            <Input
              name={ fieldId('status') }
              title="Clamped to 200-599"
              className={ styles.numberInput }
              value={ String(rule.status) }
              onChange={ handleStatusChange }
            />
          </div>
          <div className={ styles.ruleField }>
            <span className={ styles.fieldLabel }>Delay</span>
            <Input
              name={ fieldId('delay') }
              className={ styles.numberInput }
              value={ String(rule.delay) }
              onChange={ handleDelayChange }
            />
            <span className={ styles.fieldSuffix }>ms</span>
          </div>
        </div>
        <Button
          className={ styles.removeButton }
          title="Remove rule"
          onClick={ handleRemoveClick }
        >
          <Icon type={ IconType.Close } />
        </Button>
      </div>
      <textarea
        name={ fieldId('body') }
        className={ cn(styles.body, { [styles.isInvalid]: !isBodyValid }) }
        spellCheck={ false }
        value={ rule.body }
        onChange={ handleBodyChange }
      />
      { !isBodyValid && (
        <div className={ styles.invalidHint }>
          Not valid JSON - this rule stays inactive until it parses.
        </div>
      ) }
    </div>
  );
};

export default InterceptorRule;
