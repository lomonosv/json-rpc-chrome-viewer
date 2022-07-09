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
      <Button className={ styles.infoDisabledButton }>
        Copied
      </Button>
    );
  }

  return (
    <CopyToClipboard
      text={ text }
      onCopy={ handleCopy }
    >
      <Button>Copy</Button>
    </CopyToClipboard>
  );
};

export default CopyButton;
