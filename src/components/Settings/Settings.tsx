import React from 'react';
import ReactDOM from 'react-dom';
import styles from './settings.scss';

const Settings = () => ReactDOM.createPortal(
  <div className={ styles.settingsWrapper }>Settings</div>,
  document.getElementById('portal')
);

export default Settings;
