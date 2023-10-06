import React from 'react';
import Portal from '~/components/common/Portal';
import styles from './modal.scss';

interface IProps {
  isVisible: boolean,
  children: React.ReactNode,
  close: () => void,
}
const Modal = ({
  isVisible,
  children,
  close
}: IProps) => {
  if (!isVisible) {
    return null;
  }

  return (
    <Portal>
      <div
        className={ styles.wrapper }
        onClick={ close }
      >
        <div className={ styles.modal }>
          { children }
        </div>
      </div>
    </Portal>
  );
};

export default Modal;
