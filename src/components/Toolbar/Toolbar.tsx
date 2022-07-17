import React, { ChangeEventHandler, useEffect, useRef } from 'react';
import { useRequestContext } from '~/logic/HTTPArchive/HttpArchiveContext';
import { useSettingsContext } from '~/logic/SettingsContext/SettingsContext';
import Button from '~/components/common/Button';
import SettingsButton from '~/components/common/SettingsButton';
import Input, { Type } from '~/components/common/Input';
import Icon, { IconType } from '~/components/common/Icon';
import styles from './toolbar.scss';

const Toolbar = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { filter, clear, setFilter } = useRequestContext();
  const {
    preserveLog,
    setPreserveLog
  } = useSettingsContext();

  const handleFilterChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setFilter(e.target.value);
  };

  const handlePreserveLogChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setPreserveLog(e.target.checked);
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
      <div className={ styles.toolbarContainer }>
        <div className={ styles.toolbarSection }>
          <Button
            onClick={ clear }
            className={ styles.clearButton }
            title="Clear list"
          >
            <Icon
              className={ styles.clearIcon }
              type={ IconType.Clear }
            />
          </Button>
          <Input
            name="filter"
            ref={ inputRef }
            placeholder="Filter"
            className={ styles.filter }
            value={ filter }
            onChange={ handleFilterChange }
            clearComponent={ (
              <div
                className={ styles.filterClearIconWrapper }
                onClick={ () => setFilter('') }
              >
                <Icon
                  className={ styles.filterClearIcon }
                  type={ IconType.Close }
                />
              </div>
            ) }
          />
          <Input
            name="preserveLog"
            label="Preserve log"
            wrapperClassName={ styles.settingsItemWrapper }
            type={ Type.Checkbox }
            checked={ preserveLog }
            onChange={ handlePreserveLogChange }
          />
        </div>
        <div className={ styles.toolbarSection }>
          <SettingsButton />
        </div>
      </div>
  );
};

export default Toolbar;
