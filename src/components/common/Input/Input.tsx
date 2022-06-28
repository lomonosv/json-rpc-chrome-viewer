import React, { ChangeEventHandler, ForwardedRef } from 'react';
import cn from 'classnames';
import { Type } from './Type';
import styles from './input.scss';

interface IComponentProps {
  type?: Type,
  className?: string,
  placeholder: string,
  value?: string,
  onChange: ChangeEventHandler<HTMLInputElement>
}

const Input = ({
  type = Type.Text,
  className,
  placeholder,
  value = '',
  onChange,
  inputRef
}: IComponentProps & {
  inputRef: ForwardedRef<HTMLInputElement>
}) => (
  <input
    ref={ inputRef }
    className={ cn(styles.input, className) }
    type={ type }
    placeholder={ placeholder }
    onChange={ onChange }
    value={ value }
  />
);

export default React.forwardRef((props: IComponentProps, ref: ForwardedRef<HTMLInputElement>) => (
  <Input
    { ...props }
    inputRef={ ref }
  />
));
