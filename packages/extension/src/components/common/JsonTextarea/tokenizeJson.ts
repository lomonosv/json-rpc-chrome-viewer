export enum JsonTokenType {
  Key = 'key',
  String = 'string',
  Number = 'number',
  Literal = 'literal',
  Punctuation = 'punctuation',
  Plain = 'plain',
}

export interface IJsonToken {
  type: JsonTokenType,
  text: string,
}

const tokenPattern = /("(?:\\.|[^"\\])*")(\s*:)?|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|\b(?:true|false|null)\b|[{}[\],:]/g;

const getTokenType = (match: RegExpExecArray): JsonTokenType => {
  const [text, string, colon, number] = match;

  if (string) {
    return colon ? JsonTokenType.Key : JsonTokenType.String;
  }

  if (number) {
    return JsonTokenType.Number;
  }

  return text === 'true' || text === 'false' || text === 'null'
    ? JsonTokenType.Literal
    : JsonTokenType.Punctuation;
};

const tokenizeJson = (source: string): IJsonToken[] => {
  const tokens: IJsonToken[] = [];
  let lastIndex = 0;

  tokenPattern.lastIndex = 0;

  for (let match = tokenPattern.exec(source); match; match = tokenPattern.exec(source)) {
    if (match.index > lastIndex) {
      tokens.push({ type: JsonTokenType.Plain, text: source.slice(lastIndex, match.index) });
    }

    const [text, string, colon] = match;
    const type = getTokenType(match);

    if (type === JsonTokenType.Key) {
      tokens.push({ type, text: string });
      tokens.push({ type: JsonTokenType.Punctuation, text: colon });
    } else {
      tokens.push({ type, text });
    }

    lastIndex = match.index + text.length;
  }

  if (lastIndex < source.length) {
    tokens.push({ type: JsonTokenType.Plain, text: source.slice(lastIndex) });
  }

  return tokens;
};

export default tokenizeJson;
