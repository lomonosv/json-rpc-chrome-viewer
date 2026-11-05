import React, { ChangeEventHandler, UIEventHandler, useRef } from 'react';
import cn from 'classnames';
import tokenizeJson, { IJsonToken, JsonTokenType } from './tokenizeJson';
import styles from './jsonTextarea.scss';

interface IComponentProps {
  name: string,
  value: string,
  onChange: ChangeEventHandler<HTMLTextAreaElement>,
  className?: string,
  isDisabled?: boolean,
  isInvalid?: boolean,
}

const tokenClassNames: Record<JsonTokenType, string> = {
  [JsonTokenType.Key]: styles.key,
  [JsonTokenType.String]: styles.string,
  [JsonTokenType.Number]: styles.number,
  [JsonTokenType.Literal]: styles.literal,
  [JsonTokenType.Punctuation]: styles.punctuation,
  [JsonTokenType.Plain]: styles.plain
};

const renderToken = (token: IJsonToken, index: number) => (
  <span
    key={ index }
    className={ tokenClassNames[token.type] }
  >
    { token.text }
  </span>
);

const JsonTextarea = ({
  name,
  value,
  onChange,
  className,
  isDisabled = false,
  isInvalid = false
}: IComponentProps) => {
  const highlightRef = useRef<HTMLPreElement>(null);

  const handleScroll: UIEventHandler<HTMLTextAreaElement> = (e) => {
    const highlight = highlightRef.current;

    if (!highlight) {
      return;
    }

    highlight.scrollTop = e.currentTarget.scrollTop;
    highlight.scrollLeft = e.currentTarget.scrollLeft;
  };

  return (
    <div className={ cn(styles.wrapper, className, { [styles.isDisabled]: isDisabled }) }>
      <pre
        ref={ highlightRef }
        aria-hidden="true"
        className={ cn(styles.highlight, { [styles.isInvalid]: isInvalid }) }
      >
        { tokenizeJson(value).map(renderToken) }
        { /* A <pre> drops a trailing newline, which would leave the caret on a
             line the highlight layer has not scrolled to. */ }
        { '\n' }
      </pre>
      <textarea
        name={ name }
        className={ cn(styles.input, { [styles.isInvalid]: isInvalid }) }
        spellCheck={ false }
        value={ value }
        disabled={ isDisabled }
        onChange={ onChange }
        onScroll={ handleScroll }
      />
    </div>
  );
};

export default JsonTextarea;
