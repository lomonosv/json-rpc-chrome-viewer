import React, { useEffect, useState } from 'react';
import Button from '../Button';
import Icon, { IconType } from '../Icon';
import { ExpandTreeState } from '../JsonViewer/ExpandTreeState';
import styles from './expandButton.scss';

interface IComponentProps {
  className?: string,
  expandedState: ExpandTreeState,
  onChangeState: (expandedState: ExpandTreeState) => void
}

const ExpandButton = ({ className, expandedState, onChangeState }: IComponentProps) => {
  const [expandedStateValue, setExpandedStateValue] = useState<ExpandTreeState>(expandedState);

  useEffect(() => {
    setExpandedStateValue(expandedState);
  }, [expandedState]);

  const handleExpandedStateChange = () => {
    const expandedState = expandedStateValue === ExpandTreeState.Expanded
      ? ExpandTreeState.Collapsed : ExpandTreeState.Expanded;

    setExpandedStateValue(expandedState);
    onChangeState(expandedState);
  };

  return (
    <Button
      className={ className }
      onClick={ handleExpandedStateChange }
      title={ expandedStateValue === ExpandTreeState.Expanded ? 'Collapse all' : 'Expand all' }
    >
      <Icon
        className={ styles.expandButton }
        type={ expandedStateValue === ExpandTreeState.Expanded ? IconType.Collapse : IconType.Expand }
      />
    </Button>
  );
};

export default ExpandButton;
