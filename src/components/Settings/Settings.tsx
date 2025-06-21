import React, { ChangeEventHandler } from 'react';
import cn from 'classnames';
import Header from '~/components/common/Header';
import Button from '~/components/common/Button';
import Icon, { IconType } from '~/components/common/Icon';
import Portal from '~/components/common/Portal';
import Input, { Type } from '~/components/common/Input';
import Select from '~/components/common/Select';
import { useSettingsContext } from '~/logic/SettingsContext/SettingsContext';
import { ExpandTreeState, ExpandTreeStateTitlesMap } from '~/components/common/JsonViewer/ExpandTreeState';
import { ExtensionTheme, JsonViewerTheme } from '~/logic/SettingsContext/Theme';
import styles from './settings.scss';

interface IComponentProps {
  onClose: () => void
}

const Settings = ({ onClose }: IComponentProps) => {
  const {
    preserveLog,
    setPreserveLog,
    showRequestUrl,
    setShowRequestUrl,
    showCorsBadge,
    setShowCorsBadge,
    showWebsocketBadge,
    setShowWebsocketBadge,
    expandTreeState,
    setExpandTreeState,
    expandedWebsocketMessagesState,
    setExpandedWebsocketMessagesState,
    extensionTheme,
    setExtensionTheme,
    jsonViewerTheme,
    setJsonViewerTheme,
    autoScroll,
    setAutoScroll,
    includeJsonRpcLogs,
    setIncludeJsonRpcLogs,
    includeWebsocketLogs,
    setIncludeWebsocketLogs,
  } = useSettingsContext();

  const handlePreserveLogChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setPreserveLog(e.target.checked);
  };

  const handleShowRequestUrlChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setShowRequestUrl(e.target.checked);
  };

  const handleShowCorsBadgeChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setShowCorsBadge(e.target.checked);
  };

  const handleShowWebsocketBadgeChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setShowWebsocketBadge(e.target.checked);
  };

  const handleAutoScrollChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setAutoScroll(e.target.checked);
  };

  const handleExpandTreeStateChange: ChangeEventHandler<HTMLSelectElement> = (e) => {
    setExpandTreeState(+e.target.value);
  };

  const handleExpandedWebsocketMessagesStateChange: ChangeEventHandler<HTMLSelectElement> = (e) => {
    setExpandedWebsocketMessagesState(+e.target.value);
  };

  const handleExtensionThemeChange: ChangeEventHandler<HTMLSelectElement> = (e) => {
    setExtensionTheme(e.target.value as ExtensionTheme);
  };

  const handleJsonViewerThemeChange: ChangeEventHandler<HTMLSelectElement> = (e) => {
    setJsonViewerTheme(e.target.value as JsonViewerTheme);
  };

  const handleIncludeJsonRpcLogsChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setIncludeJsonRpcLogs(e.target.checked);
  };

  const handleIncludeWebsocketLogsChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setIncludeWebsocketLogs(e.target.checked);
  };

  const expandedTreeStateOptions = Object.keys(ExpandTreeStateTitlesMap).map((id) => ({
    key: +id,
    value: ExpandTreeStateTitlesMap[id]
  }));

  const extensionThemeOptions = Object.values(ExtensionTheme).map((key) => ({
    key,
    value: key
  }));

  const jsonViewerThemeOptions = Object.values(JsonViewerTheme).map((key) => ({
    key,
    value: key
  }));

  return (
    <Portal>
      <div className={ styles.settingsWrapper }>
        <Header>
          <strong>JSON-RPC Chrome Viewer Settings</strong>
          <Button
            className={ styles.closeButton }
            onClick={ onClose }
          >
            <Icon type={ IconType.Close } />
          </Button>
        </Header>
        <div className={ styles.settingsContainer }>
          <div className={ styles.settingsSection }>
            <h4>General</h4>
            <div className={ styles.settingsItem }>
              <Input
                name="preserveLog"
                label="Preserve log"
                wrapperClassName={ styles.settingsItemWrapper }
                type={ Type.Checkbox }
                checked={ preserveLog }
                onChange={ handlePreserveLogChange }
              />
            </div>
            <div className={ styles.settingsItem }>
              <Input
                  name="autoScroll"
                  label="Autoscroll to the latest request"
                  wrapperClassName={ styles.settingsItemWrapper }
                  type={ Type.Checkbox }
                  checked={ autoScroll }
                  onChange={ handleAutoScrollChange }
              />
            </div>
          </div>
          <div className={ styles.settingsSection }>
            <h4>Appearance</h4>
            <div className={ styles.settingsItem }>
              <span>Theme: </span>
              <Select<ExtensionTheme>
                name="extensionTheme"
                className={ cn(styles.select, styles.themeSelect) }
                options={ extensionThemeOptions }
                value={ extensionTheme }
                onChange={ handleExtensionThemeChange }
              />
            </div>
            <div className={ styles.settingsItem }>
              <Input
                name="showRequestUrl"
                label="Show url for each request"
                wrapperClassName={ styles.settingsItemWrapper }
                type={ Type.Checkbox }
                checked={ showRequestUrl }
                onChange={ handleShowRequestUrlChange }
              />
            </div>
            <div className={ styles.settingsItem }>
              <Input
                name="showCorsBadge"
                label="Show CORS badge for each request"
                wrapperClassName={ styles.settingsItemWrapper }
                type={ Type.Checkbox }
                checked={ showCorsBadge }
                isDisabled={ !showRequestUrl }
                onChange={ handleShowCorsBadgeChange }
              />
            </div>
            <div className={ styles.settingsItem }>
              <Input
                name="showWebsocketBadge"
                label="Show Websocket badge for websocket messages"
                wrapperClassName={ styles.settingsItemWrapper }
                type={ Type.Checkbox }
                checked={ showWebsocketBadge }
                isDisabled={ !showRequestUrl }
                onChange={ handleShowWebsocketBadgeChange }
              />
            </div>
            <div className={ styles.settingsItem }>
              <span>JSON Tree Viewer Theme: </span>
              <Select<JsonViewerTheme>
                name="jsonViewerTheme"
                className={ cn(styles.select, styles.themeSelect) }
                options={ jsonViewerThemeOptions }
                value={ jsonViewerTheme }
                onChange={ handleJsonViewerThemeChange }
              />
            </div>
            <div className={ styles.settingsItem }>
              <span>JSON Tree Open State: </span>
              <Select<ExpandTreeState>
                name="expandedTreeState"
                className={ styles.select }
                options={ expandedTreeStateOptions }
                value={ expandTreeState }
                onChange={ handleExpandTreeStateChange }
              />
            </div>
            <div className={ styles.settingsItem }>
              <span>JSON Tree Open State (Websocket Messages): </span>
              <Select<ExpandTreeState>
                name="expandedWebsocketTreeState"
                className={ styles.select }
                options={ expandedTreeStateOptions }
                value={ expandedWebsocketMessagesState }
                onChange={ handleExpandedWebsocketMessagesStateChange }
              />
            </div>
          </div>
          <div className={ styles.settingsSection }>
            <h4>Filters</h4>
            <div className={ styles.settingsItem }>
              <Input
                name="includeJsonRpcLogs"
                label="Include JSON-RPC Logs"
                wrapperClassName={ styles.settingsItemWrapper }
                type={ Type.Checkbox }
                checked={ includeJsonRpcLogs }
                onChange={ handleIncludeJsonRpcLogsChange }
              />
            </div>
            <div className={ styles.settingsItem }>
              <Input
                name="includeWebsocketLogs"
                label="Include Websocket Logs"
                wrapperClassName={ styles.settingsItemWrapper }
                type={ Type.Checkbox }
                checked={ includeWebsocketLogs }
                onChange={ handleIncludeWebsocketLogsChange }
              />
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default Settings;
