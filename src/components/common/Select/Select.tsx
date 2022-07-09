import React, { ChangeEventHandler } from 'react';
import cn from 'classnames';
import styles from './select.scss';

interface IComponentProps<T> {
  name: string,
  className?: string,
  value: T,
  options: { key: T, value: string }[],
  onChange: ChangeEventHandler<HTMLSelectElement>
}

const Select = <T extends number>({ name, className, value, options, onChange }: IComponentProps<T>) => (
  <select
    name={ name }
    className={ cn(styles.select, className) }
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
