import React from 'react';
import Button from '../common/Button';
import Icon, { IconType } from '../common/Icon';
import Portal from '../common/Portal';
import styles from './settings.scss';

interface IComponentProps {
  onClose: () => void
}

const Settings = ({ onClose }: IComponentProps) => (
  <Portal>
    <div className={ styles.settingsWrapper }>
      Settings
      <Button
        content={ (
          <Icon
            type={ IconType.Close }
          />
        ) }
        onClick={ onClose }
      />
    </div>
  </Portal>
);

export default Settings;
