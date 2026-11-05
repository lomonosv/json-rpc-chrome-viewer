import React, { ChangeEventHandler, useEffect, useRef } from 'react';
import cn from 'classnames';
import { useRequestContext } from '~/logic/HTTPArchive/HttpArchiveContext';
import { useSettingsContext } from '~/logic/SettingsContext/SettingsContext';
import { SearchScope, searchScopeOptions } from '~/logic/HTTPArchive/SearchScope';
import Button from '~/components/common/Button';
import InterceptorButton from '~/components/Interceptor';
import SettingsButton from '~/components/common/SettingsButton';
import Input, { Type } from '~/components/common/Input';
import Select from '~/components/common/Select';
import Icon, { IconType } from '~/components/common/Icon';
import { serverLoggerPackageName } from '~/logic/HTTPArchive/serverLog';
import useToolbarFit from './useToolbarFit';
import styles from './toolbar.scss';

const Toolbar = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const preserveLogRef = useRef<HTMLInputElement>(null);
  const includeJsonRpcLogsRef = useRef<HTMLInputElement>(null);
  const includeWebsocketLogsRef = useRef<HTMLInputElement>(null);
  const includeServerLogsRef = useRef<HTMLInputElement>(null);
  const visibleOptionalCount = useToolbarFit(sectionRef, inputRef, [
    preserveLogRef,
    includeJsonRpcLogsRef,
    includeWebsocketLogsRef,
    includeServerLogsRef
  ]);
  const { filter, clear, setFilter } = useRequestContext();
  const {
    preserveLog,
    setPreserveLog,
    includeJsonRpcLogs,
    setIncludeJsonRpcLogs,
    includeWebsocketLogs,
    setIncludeWebsocketLogs,
    includeServerLogs,
    setIncludeServerLogs,
    searchScope,
    setSearchScope,
    caseSensitiveSearch,
    setCaseSensitiveSearch
  } = useSettingsContext();

  const handleFilterChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setFilter(e.target.value);
  };

  const handleSearchScopeChange: ChangeEventHandler<HTMLSelectElement> = (e) => {
    setSearchScope(e.target.value as SearchScope);
  };

  const handleCaseSensitiveSearchChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setCaseSensitiveSearch(e.target.checked);
  };

  const handlePreserveLogChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setPreserveLog(e.target.checked);
  };

  const handleIncludeJsonRpcLogsChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setIncludeJsonRpcLogs(e.target.checked);
  };

  const handleIncludeWebsocketLogsChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setIncludeWebsocketLogs(e.target.checked);
  };

  const handleIncludeServerLogsChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setIncludeServerLogs(e.target.checked);
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const getOptionalClassName = (index: number) => cn(styles.settingsItemWrapper, {
    [styles.isOverflowing]: index >= visibleOptionalCount
  });

  return (
      <div className={ styles.toolbarContainer }>
        <div
          ref={ sectionRef }
          className={ styles.toolbarSection }
        >
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
            wrapperClassName={ styles.filterWrapper }
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
          <Select
            name="searchScope"
            title="Search scope"
            className={ styles.searchScope }
            value={ searchScope }
            options={ searchScopeOptions }
            onChange={ handleSearchScopeChange }
          />
          <Input
            name="caseSensitiveSearch"
            label="Aa"
            title="Match case"
            wrapperClassName={ styles.settingsItemWrapper }
            type={ Type.Checkbox }
            checked={ caseSensitiveSearch }
            onChange={ handleCaseSensitiveSearchChange }
          />
          <Input
            name="preserveLog"
            ref={ preserveLogRef }
            label="Preserve log"
            wrapperClassName={ getOptionalClassName(0) }
            type={ Type.Checkbox }
            checked={ preserveLog }
            onChange={ handlePreserveLogChange }
          />
          <Input
            name="includeJsonRpcLogs"
            ref={ includeJsonRpcLogsRef }
            label="Include JSON-RPC Logs"
            wrapperClassName={ getOptionalClassName(1) }
            type={ Type.Checkbox }
            checked={ includeJsonRpcLogs }
            onChange={ handleIncludeJsonRpcLogsChange }
          />
          <Input
            name="includeWebsocketLogs"
            ref={ includeWebsocketLogsRef }
            label="Include Websocket Logs"
            wrapperClassName={ getOptionalClassName(2) }
            type={ Type.Checkbox }
            checked={ includeWebsocketLogs }
            onChange={ handleIncludeWebsocketLogsChange }
          />
          <Input
            name="includeServerLogs"
            ref={ includeServerLogsRef }
            label="Include Server Logs"
            title={ `JSON-RPC calls your server made. Requires ${ serverLoggerPackageName } in your app.` }
            wrapperClassName={ getOptionalClassName(3) }
            type={ Type.Checkbox }
            checked={ includeServerLogs }
            onChange={ handleIncludeServerLogsChange }
          />
        </div>
        <div className={ styles.toolbarSection }>
          <InterceptorButton />
          <SettingsButton />
        </div>
      </div>
  );
};

export default Toolbar;
