import React from 'react';
import cn from 'classnames';
import Portal from '~/components/common/Portal';
import styles from './modal.scss';

interface IProps {
  isVisible: boolean,
  className?: string,
  header?: React.ReactNode,
  children: React.ReactNode,
  footer?: React.ReactNode,
  close: () => void,
}
const Modal = ({
  isVisible,
  className,
  header,
  children,
  footer,
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
        <div className={ styles.backgroundOverlay }/>
        <div
          onClick={ (e) => e.stopPropagation() }
          className={ cn(styles.modal, className) }
        >
          <div className={ styles.header }>
            { header }
          </div>
          <div>
            { children }
          </div>
          <div className={ styles.footer }>
            { footer }
          </div>
        </div>
      </div>
    </Portal>
  );
};

export default Modal;
