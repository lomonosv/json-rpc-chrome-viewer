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
import { JsonViewerTheme } from '~/logic/SettingsContext/Theme';
import styles from './settings.scss';

interface IComponentProps {
  onClose: () => void
}

const Settings = ({ onClose }: IComponentProps) => {
  const {
    showRequestUrl,
    setShowRequestUrl,
    showCorsBadge,
    setShowCorsBadge,
    expandTreeState,
    setExpandTreeState,
    jsonViewerTheme,
    setJsonViewerTheme
  } = useSettingsContext();

  const handleShowRequestUrlChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setShowRequestUrl(e.target.checked);
  };

  const handleShowCorsBadgeChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setShowCorsBadge(e.target.checked);
  };

  const handleExpandTreeStateChange: ChangeEventHandler<HTMLSelectElement> = (e) => {
    setExpandTreeState(+e.target.value);
  };

  const handleJsonViewerThemeChange: ChangeEventHandler<HTMLSelectElement> = (e) => {
    setJsonViewerTheme(e.target.value as JsonViewerTheme);
  };

  const expandedTreeStateOptions = Object.keys(ExpandTreeStateTitlesMap).map((id) => ({
    key: +id,
    value: ExpandTreeStateTitlesMap[id]
  }));

  const jsonViewerThemeOptions = Object.values(JsonViewerTheme).map((key) => ({
    key,
    value: key
  }));

  return (
    <Portal>
      <div className={ styles.settingsWrapper }>
        <Header>
          <span>JSON-RPC Chrome Viewer Settings</span>
          <Button
            className={ styles.closeButton }
            onClick={ onClose }
          >
            <Icon type={ IconType.Close } />
          </Button>
        </Header>
        <div className={ styles.settingsContainer }>
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
            <span>JSON tree open state: </span>
            <Select<ExpandTreeState>
              name="expandedTreeState"
              className={ styles.select }
              options={ expandedTreeStateOptions }
              value={ expandTreeState }
              onChange={ handleExpandTreeStateChange }
            />
          </div>
          <div className={ styles.settingsItem }>
            <span>JSON tree Theme: </span>
            <Select<JsonViewerTheme>
              name="jsonViewerTheme"
              className={ cn(styles.select, styles.themeSelect) }
              options={ jsonViewerThemeOptions }
              value={ jsonViewerTheme }
              onChange={ handleJsonViewerThemeChange }
            />
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default Settings;
