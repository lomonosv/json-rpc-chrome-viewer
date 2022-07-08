import React, { ChangeEventHandler, useEffect, useRef } from 'react';
import { useRequestContext } from '../../logic/HTTPArchive/HttpArchiveContext';
import { useSettingsContext } from '../../logic/SettingsContext';
import Button from '../common/Button';
import Input, { Type } from '../common/Input';
import Icon, { IconType } from '../common/Icon';
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

  const handleFilterChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setFilter(e.target.value);
  };

  const handlePreserveLogChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setPreserveLog(e.target.checked);
  };

  const handleShowRequestUrlChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setShowRequestUrl(e.target.checked);
  };

  const handleShowCorsBadgeChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setShowCorsBadge(e.target.checked);
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
      <div className={ styles.toolbarContainer }>
        <div className={ styles.toolbarSection }>
          <Button
            content="Clear"
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
          <Button
            content={ (
              <div>
                <Icon type={ IconType.Settings }/>
              </div>
            ) }
          />
        </div>
      </div>
  );
};

export default Toolbar;
