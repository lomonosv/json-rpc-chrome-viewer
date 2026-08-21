import React, { ChangeEventHandler, useEffect, useRef, useState } from 'react';
import cn from 'classnames';
import { useRequestContext } from '~/logic/HTTPArchive/HttpArchiveContext';
import { useMocksContext } from '~/logic/Mocks/MocksContext';
import Mocks from '~/components/Mocks';
import { useSettingsContext } from '~/logic/SettingsContext/SettingsContext';
import { SearchScope, searchScopeOptions } from '~/logic/HTTPArchive/SearchScope';
import Button from '~/components/common/Button';
import SettingsButton from '~/components/common/SettingsButton';
import Input, { Type } from '~/components/common/Input';
import Select from '~/components/common/Select';
import Icon, { IconType } from '~/components/common/Icon';
import styles from './toolbar.scss';

const Toolbar = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isMocksVisible, setIsMocksVisible] = useState(false);
  const { filter, clear, setFilter } = useRequestContext();
  const { rules, mocksEnabled } = useMocksContext();
  const activeRuleCount = rules.filter(({ enabled }) => enabled).length;
  const {
    preserveLog,
    setPreserveLog,
    includeJsonRpcLogs,
    setIncludeJsonRpcLogs,
    includeWebsocketLogs,
    setIncludeWebsocketLogs,
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

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
      <div className={ styles.toolbarContainer }>
        <div className={ styles.toolbarSection }>
          { mocksEnabled && (
            <Button
              onClick={ () => setIsMocksVisible(true) }
              className={ styles.mocksWarning }
              title={ activeRuleCount
                ? `Responses are being mocked — ${ activeRuleCount } active rule${
                  activeRuleCount === 1 ? '' : 's' }`
                : 'Mocking is enabled, but no rule is active' }
            >
              <Icon
                className={ styles.mocksWarningIcon }
                type={ IconType.Warning }
              />
            </Button>
          ) }
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
          <Select
            name="searchScope"
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
            label="Preserve log"
            wrapperClassName={ styles.settingsItemWrapper }
            type={ Type.Checkbox }
            checked={ preserveLog }
            onChange={ handlePreserveLogChange }
          />
          <Input
            name="includeJsonRpcLogs"
            label="Include JSON-RPC Logs"
            wrapperClassName={ styles.settingsItemWrapper }
            type={ Type.Checkbox }
            checked={ includeJsonRpcLogs }
            onChange={ handleIncludeJsonRpcLogsChange }
          />
          <Input
            name="includeWebsocketLogs"
            label="Include Websocket Logs"
            wrapperClassName={ styles.settingsItemWrapper }
            type={ Type.Checkbox }
            checked={ includeWebsocketLogs }
            onChange={ handleIncludeWebsocketLogsChange }
          />
        </div>
        <div className={ styles.toolbarSection }>
          <Button
            onClick={ () => setIsMocksVisible(true) }
            className={ styles.mocksButton }
            title={ mocksEnabled ? 'Response mocks (active)' : 'Response mocks' }
          >
            <Icon
              className={ cn(styles.mocksIcon, { [styles.isActive]: mocksEnabled }) }
              type={ IconType.Mock }
            />
          </Button>
          <SettingsButton />
        </div>
        { isMocksVisible && <Mocks onClose={ () => setIsMocksVisible(false) } /> }
      </div>
  );
};

export default Toolbar;
