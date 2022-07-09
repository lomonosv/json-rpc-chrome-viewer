import React, { ChangeEventHandler } from 'react';
import Header from '../common/Header';
import Button from '../common/Button';
import Icon, { IconType } from '../common/Icon';
import Portal from '../common/Portal';
import Input, { Type } from '../common/Input';
import Select from '../common/Select';
import { useSettingsContext } from '../../logic/SettingsContext/SettingsContext';
import { ExpandTreeState, ExpandTreeStateTitlesMap } from '../common/JsonViewer/ExpandTreeState';
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
    setExpandTreeState
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

  const expandedTreeStateOptions = Object.keys(ExpandTreeStateTitlesMap).map((id) => ({
    key: +id,
    value: ExpandTreeStateTitlesMap[id]
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
        </div>
      </div>
    </Portal>
  );
};

export default Settings;
