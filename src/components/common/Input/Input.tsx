import React, { ChangeEventHandler, ForwardedRef } from 'react';
import cn from 'classnames';
import { Type } from './Type';
import styles from './input.scss';

interface IComponentProps {
  name: string,
  label?: string,
  type?: Type,
  className?: string,
  wrapperClassName?: string,
  placeholder?: string,
  value?: string,
  checked?: boolean,
  onChange: ChangeEventHandler<HTMLInputElement>,
  isDisabled?: boolean
}

const Input = ({
  name,
  label = '',
  type = Type.Text,
  className,
  wrapperClassName,
  placeholder = '',
  value = '',
  checked = false,
  onChange,
  isDisabled = false,
  inputRef
}: IComponentProps & {
  inputRef: ForwardedRef<HTMLInputElement>
}) => (
  <label
    htmlFor={ name }
    className={ cn(styles.inputWrapper, wrapperClassName, {
      [styles.checkboxWrapper]: type === Type.Checkbox
    }) }
  >
    <input
      name={ name }
      id={ name }
      ref={ inputRef }
      className={ cn(styles.input, className) }
      type={ type }
      placeholder={ placeholder }
      onChange={ onChange }
      disabled={ isDisabled }
      { ...(type === Type.Text ? { value } : {}) }
      { ...(type === Type.Checkbox ? { checked } : {}) }
    />
    { label && <span className={ styles.label }>{ label }</span> }
  </label>
);

export default React.forwardRef((props: IComponentProps, ref: ForwardedRef<HTMLInputElement>) => (
  <Input
    { ...props }
    inputRef={ ref }
  />
));
