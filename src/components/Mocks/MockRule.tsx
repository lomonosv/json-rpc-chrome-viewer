import React, { ChangeEventHandler } from 'react';
import cn from 'classnames';
import Button from '~/components/common/Button';
import Icon, { IconType } from '~/components/common/Icon';
import Input, { Type } from '~/components/common/Input';
import Select from '~/components/common/Select';
import { IMockRule, MockResponseType, mockResponseTypeOptions } from '~/logic/Mocks/IMockRule';
import { isValidMockBody } from '~/logic/Mocks/matchRule';
import styles from './mocks.scss';

interface IComponentProps {
  rule: IMockRule,
  onChange: (id: string, patch: Partial<IMockRule>) => void,
  onRemove: (id: string) => void,
}

const toNumber = (value: string, fallback: number): number => {
  const parsed = parseInt(value, 10);

  return Number.isNaN(parsed) ? fallback : parsed;
};

const MockRule = ({ rule, onChange, onRemove }: IComponentProps) => {
  const isBodyValid = isValidMockBody(rule.body);

  const handleEnabledChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    onChange(rule.id, { enabled: e.target.checked });
  };

  const handleMethodChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    onChange(rule.id, { method: e.target.value });
  };

  const handleUrlPatternChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    onChange(rule.id, { urlPattern: e.target.value });
  };

  const handleResponseTypeChange: ChangeEventHandler<HTMLSelectElement> = (e) => {
    onChange(rule.id, { responseType: e.target.value as MockResponseType });
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
    <div className={ cn(styles.rule, { [styles.isDisabled]: !rule.enabled }) }>
      <div className={ styles.ruleRow }>
        <Input
          name={ `${ rule.id }-enabled` }
          label="On"
          title="Enable this rule"
          wrapperClassName={ styles.ruleField }
          type={ Type.Checkbox }
          checked={ rule.enabled }
          onChange={ handleEnabledChange }
        />
        <Input
          name={ `${ rule.id }-method` }
          placeholder="method (supports *)"
          className={ styles.methodInput }
          wrapperClassName={ styles.ruleField }
          value={ rule.method }
          onChange={ handleMethodChange }
        />
        <Input
          name={ `${ rule.id }-urlPattern` }
          placeholder="url contains (optional)"
          className={ styles.urlInput }
          wrapperClassName={ styles.ruleField }
          value={ rule.urlPattern || '' }
          onChange={ handleUrlPatternChange }
        />
        <Select<MockResponseType>
          name={ `${ rule.id }-responseType` }
          className={ styles.ruleField }
          options={ mockResponseTypeOptions }
          value={ rule.responseType }
          onChange={ handleResponseTypeChange }
        />
        <Input
          name={ `${ rule.id }-status` }
          title="HTTP status"
          className={ styles.numberInput }
          wrapperClassName={ styles.ruleField }
          value={ String(rule.status) }
          onChange={ handleStatusChange }
        />
        <Input
          name={ `${ rule.id }-delay` }
          title="Delay in ms"
          className={ styles.numberInput }
          wrapperClassName={ styles.ruleField }
          value={ String(rule.delay) }
          onChange={ handleDelayChange }
        />
        <Button
          className={ styles.removeButton }
          title="Remove rule"
          onClick={ () => onRemove(rule.id) }
        >
          <Icon type={ IconType.Close } />
        </Button>
      </div>
      <textarea
        className={ cn(styles.body, { [styles.isInvalid]: !isBodyValid }) }
        spellCheck={ false }
        value={ rule.body }
        onChange={ handleBodyChange }
      />
      { !isBodyValid && (
        <div className={ styles.invalidHint }>
          Not valid JSON — it will be sent as a plain string.
        </div>
      ) }
    </div>
  );
};

export default MockRule;
