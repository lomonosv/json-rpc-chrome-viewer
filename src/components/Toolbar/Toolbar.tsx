import React, { useRef, useEffect, ChangeEvent } from 'react';
import { useRequestContext } from '../../logic/HTTPArchive/HttpArchiveContext';
import { useSettingsContext } from '../../logic/SettingsContext';
import Button from '../common/Button';
import Input, { Type } from '../common/Input';
import styles from './toolbar.scss';

const Toolbar = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { filter, clear, setFilter } = useRequestContext();
  const {
    preserveLog,
    setPreserveLog,
    showRequestUrl,
    setShowRequestUrl,
    showCorsBadge,
    setShowCorsBadge
  } = useSettingsContext();

  const handleFilterChange = (e: ChangeEvent<{ value: string }>) => {
    setFilter(e.target.value);
  };

  const handlePreserveLogChange = (e: ChangeEvent<{ checked: boolean }>) => {
    setPreserveLog(e.target.checked);
  };

  const handleShowRequestUrlChange = (e: ChangeEvent<{ checked: boolean }>) => {
    setShowRequestUrl(e.target.checked);
  };

  const handleShowCorsBadgeChange = (e: ChangeEvent<{ checked: boolean }>) => {
    setShowCorsBadge(e.target.checked);
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
      <div className={ styles.toolbarContainer }>
        <div className={ styles.toolbarSection }>
          <Button
            text="Clear"
            onClick={ clear }
          />
          <Input
            name="filter"
            ref={ inputRef }
            placeholder="Filter"
            className={ styles.filter }
            value={ filter }
            onChange={ handleFilterChange }
            clearComponent={ (
              <div
                className={ styles.filterClearIcon }
                onClick={ () => setFilter('') }
              >
                &times;
              </div>
            ) }
          />
        </div>
        <div className={ styles.toolbarSection }>
          <Input
            name="preserveLog"
            label="Preserve log"
            wrapperClassName={ styles.settingsItemWrapper }
            type={ Type.Checkbox }
            checked={ preserveLog }
            onChange={ handlePreserveLogChange }
          />
          <Input
            name="showRequestUrl"
            label="Show request url"
            wrapperClassName={ styles.settingsItemWrapper }
            type={ Type.Checkbox }
            checked={ showRequestUrl }
            onChange={ handleShowRequestUrlChange }
          />
          <Input
            name="showCorsBadge"
            label="Show CORS badge"
            wrapperClassName={ styles.settingsItemWrapper }
            type={ Type.Checkbox }
            checked={ showCorsBadge }
            isDisabled={ !showRequestUrl }
            onChange={ handleShowCorsBadgeChange }
          />
        </div>
      </div>
  );
};

export default Toolbar;
