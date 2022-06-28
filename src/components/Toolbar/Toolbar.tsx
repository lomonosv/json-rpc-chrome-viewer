import React, { useRef, useEffect, ChangeEvent } from 'react';
import { useRequestContext } from '../../logic/HTTPArchive/HttpArchiveContext';
import Button from '../common/Button';
import Input from '../common/Input';
import styles from './toolbar.scss';

const Toolbar = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { filter, clear, setFilter } = useRequestContext();

  const handleFilterChange = (e: ChangeEvent<{ value: string }>) => {
    setFilter(e.target.value);
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
      <div>
        <Button
          text="Clear"
          onClick={ clear }
        />
        <Input
          ref={ inputRef }
          placeholder="Filter"
          className={ styles.filter }
          value={ filter }
          onChange={ handleFilterChange }
        />
      </div>
  );
};

export default Toolbar;
