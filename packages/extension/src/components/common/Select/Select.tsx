import React, { ChangeEventHandler } from 'react';
import cn from 'classnames';
import styles from './select.scss';

interface IComponentProps<T> {
  name: string,
  id?: string,
  title?: string,
  className?: string,
  value: T,
  options: { key: T, value: string }[],
  onChange: ChangeEventHandler<HTMLSelectElement>,
  isDisabled?: boolean,
}

const Select = <T extends string | number>({
  name,
  id,
  title,
  className,
  value,
  options,
  onChange,
  isDisabled = false
}: IComponentProps<T>) => (
  <select
    name={ name }
    id={ id }
    title={ title }
    aria-label={ title }
    className={ cn(styles.select, className) }
    disabled={ isDisabled }
    onChange={ onChange }
  >
    { options.map((option) => (
      <option
        key={ option.key }
        value={ option.key }
        selected={ option.key === value }
      >
        { option.value }
      </option>
    ))}
  </select>
);

export default Select;
