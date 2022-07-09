import React, { useState } from 'react';
import Button from '../Button';
import Icon, { IconType } from '../Icon';
import Settings from '../../Settings';

const SettingsButton = () => {
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);

  const handleSettingsModalShow = () => {
    setIsSettingsModalVisible(true);
  };

  const handleSettingsModalHide = () => {
    setIsSettingsModalVisible(false);
  };

  return (
    <>
      <Button onClick={ handleSettingsModalShow }>
        <Icon type={ IconType.Settings }/>
      </Button>
      { isSettingsModalVisible && <Settings onClose={ handleSettingsModalHide }/> }
    </>
  );
};

export default SettingsButton;
