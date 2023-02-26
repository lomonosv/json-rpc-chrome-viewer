import React, { useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import Button from '~/components/common/Button';
import Icon, { IconType } from '~/components/common/Icon';
import styles from './copyButton.scss';

interface IComponentProps {
  text: string,
  className?: string,
  hint?: string,
  iconType?: IconType
}

const CopyButton = ({
  text,
  className,
  hint = 'Copy to clipboard',
  iconType = IconType.Copy
}: IComponentProps) => {
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
      <Button
        title={ hint }
        className={ className }
      >
        <Icon type={ iconType } />
      </Button>
    </CopyToClipboard>
  );
};

export default CopyButton;
