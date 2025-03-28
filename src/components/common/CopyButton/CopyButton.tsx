import React, { useState } from 'react';
import copyToClipboard from 'copy-to-clipboard';
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
    copyToClipboard(text);
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
    <Button
      title={ hint }
      className={ className }
      onClick={ handleCopy }
    >
      <Icon type={ iconType } />
    </Button>
  );
};

export default CopyButton;
