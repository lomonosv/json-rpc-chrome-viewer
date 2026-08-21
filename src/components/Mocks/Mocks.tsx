import React, { ChangeEventHandler } from 'react';
import Header from '~/components/common/Header';
import Button from '~/components/common/Button';
import Icon, { IconType } from '~/components/common/Icon';
import Portal from '~/components/common/Portal';
import Input, { Type } from '~/components/common/Input';
import { useMocksContext } from '~/logic/Mocks/MocksContext';
import MockRule from './MockRule';
import styles from './mocks.scss';

interface IComponentProps {
  onClose: () => void,
}

const Mocks = ({ onClose }: IComponentProps) => {
  const {
    rules,
    mocksEnabled,
    setMocksEnabled,
    addRule,
    updateRule,
    removeRule
  } = useMocksContext();

  const handleMocksEnabledChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setMocksEnabled(e.target.checked);
  };

  return (
    <Portal>
      <div className={ styles.mocksWrapper }>
        <Header>
          <strong>JSON-RPC Response Mocks</strong>
          <Button
            className={ styles.closeButton }
            onClick={ onClose }
          >
            <Icon type={ IconType.Close } />
          </Button>
        </Header>
        <div className={ styles.mocksToolbar }>
          <Input
            name="mocksEnabled"
            label="Enable mocking"
            wrapperClassName={ styles.mocksEnabled }
            type={ Type.Checkbox }
            checked={ mocksEnabled }
            onChange={ handleMocksEnabledChange }
          />
          <Button
            className={ styles.addButton }
            onClick={ addRule }
          >
            Add rule
          </Button>
        </div>
        <div className={ styles.hint }>
          A matching response is served inside the page and never reaches the network.
          Only <code>fetch()</code> in the top frame is intercepted — XHR, WebSocket frames,
          iframes and worker requests are left alone. Rules apply to every tab, so use the url
          filter to narrow them down.
        </div>
        <div className={ styles.mocksContainer }>
          { !rules.length && (
            <div className={ styles.empty }>
              No rules yet. Add one to start mocking responses.
            </div>
          ) }
          { rules.map((rule) => (
            <MockRule
              key={ rule.id }
              rule={ rule }
              onChange={ updateRule }
              onRemove={ removeRule }
            />
          )) }
        </div>
      </div>
    </Portal>
  );
};

export default Mocks;
