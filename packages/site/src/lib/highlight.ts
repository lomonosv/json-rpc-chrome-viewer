export type TokenKind = 'key' | 'string' | 'number' | 'literal' | 'punct' | 'keyword' | 'comment' | 'plain';

export interface IToken {
  kind: TokenKind,
  text: string,
}

const jsonPattern = /("(?:\\.|[^"\\])*")(\s*:)?|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|\b(true|false|null)\b|([{}[\],:])/g;

const tsPattern = new RegExp([
  /(\/\/[^\n]*)/.source,
  /('(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)/.source,
  /\b(import|export|from|const|return|async|await|function)\b/.source
].join('|'), 'g');

// A lossless scanner, same idea as the extension's tokenizeJson: every
// character lands in exactly one token, so text no pattern claims falls
// through as plain rather than being dropped.
const scan = (source: string, pattern: RegExp, classify: (match: RegExpExecArray) => IToken[]): IToken[] => {
  const tokens: IToken[] = [];
  let last = 0;

  Array.from(source.matchAll(pattern)).forEach((match) => {
    if (match.index > last) {
      tokens.push({ kind: 'plain', text: source.slice(last, match.index) });
    }

    tokens.push(...classify(match));
    last = match.index + match[0].length;
  });

  if (last < source.length) {
    tokens.push({ kind: 'plain', text: source.slice(last) });
  }

  return tokens;
};

export const tokenizeJson = (source: string) => scan(source, jsonPattern, ([whole, string, colon, number, literal]) => {
  if (string !== undefined) {
    return colon
      ? [{ kind: 'key', text: string }, { kind: 'punct', text: colon }]
      : [{ kind: 'string', text: string }];
  }

  if (number !== undefined) {
    return [{ kind: 'number', text: number }];
  }

  if (literal !== undefined) {
    return [{ kind: 'literal', text: literal }];
  }

  return [{ kind: 'punct', text: whole }];
});

export const tokenizeTs = (source: string) => scan(source, tsPattern, ([whole, comment, string]) => {
  if (comment !== undefined) {
    return [{ kind: 'comment', text: whole }];
  }

  return [{ kind: string !== undefined ? 'string' : 'keyword', text: whole }];
});
