import React, { ChangeEventHandler } from 'react';

interface IComponentProps<T> {
  name: string,
  value: T,
  options: { key: T, value: string }[],
  onChange: ChangeEventHandler<HTMLSelectElement>
}

const Select = <T extends number>({ name, value, options, onChange }: IComponentProps<T>) => (
  <select name={ name } onChange={ onChange }>
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
