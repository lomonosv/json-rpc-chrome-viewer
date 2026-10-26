import { tokenizeJson, tokenizeTs } from '~/lib/highlight';

interface ICodeProps {
  source: string,
  language: 'json' | 'ts' | 'shell',
  className?: string,
}

export default function Code({ source, language, className }: ICodeProps) {
  if (language === 'shell') {
    return <pre className={ className }><code>{ source }</code></pre>;
  }

  const tokens = language === 'json' ? tokenizeJson(source) : tokenizeTs(source);

  return (
    <pre className={ className }>
      <code>
        { tokens.map((token, index) => (
          token.kind === 'plain'
            ? token.text
            : <span key={ index } className={ `tok-${ token.kind }` }>{ token.text }</span>
        )) }
      </code>
    </pre>
  );
}
