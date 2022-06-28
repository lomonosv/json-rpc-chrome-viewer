import React, { useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import Button from '../Button';
import styles from './copyButton.scss';

interface IComponentProps {
  text: string
}

const CopyButton = ({ text }: IComponentProps) => {
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const handleCopy = () => {
    setIsCopied(true);

    setTimeout(() => {
      setIsCopied(false);
    }, 700);
  };

  if (isCopied) {
    return (
      <Button
        text="Copied"
        className={ styles.infoDisabledButton }
      />
    );
  }

  return (
    <CopyToClipboard
      text={ text }
      onCopy={ handleCopy }
    >
      <Button text="Copy" />
    </CopyToClipboard>
  );
};

export default CopyButton;
