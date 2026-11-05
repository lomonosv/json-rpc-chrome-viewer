import { RefObject, useEffect } from 'react';
import { IJSONObject, JSONValue } from '~/logic/HTTPArchive/IRequest';

export const previewAttribute = 'data-json-preview';

const maxPreviewValueLength = 24;
const ellipsisCharacter = '...';

const isObjectNode = (value: JSONValue): value is IJSONObject | JSONValue[] => (
  typeof value === 'object' && value !== null
);

const getValuePreview = (value: JSONValue): string => {
  if (Array.isArray(value)) {
    return value.length ? `[${ ellipsisCharacter }]` : '[]';
  }

  if (isObjectNode(value)) {
    return Object.keys(value).length ? `{${ ellipsisCharacter }}` : '{}';
  }

  if (typeof value === 'string') {
    const text = value.length > maxPreviewValueLength
      ? `${ value.slice(0, maxPreviewValueLength) }${ ellipsisCharacter }`
      : value;

    return `"${ text }"`;
  }

  return String(value);
};

const getNodePreview = (node: IJSONObject | JSONValue[]): string => {
  const entries = Object.entries(node);

  if (!entries.length) {
    return '';
  }

  const [[key, value]] = entries;
  const head = Array.isArray(node) ? getValuePreview(value) : `${ key }: ${ getValuePreview(value) }`;

  return entries.length > 1 ? `\u00A0${ head }, ${ ellipsisCharacter }\u00A0` : `\u00A0${ head }\u00A0`;
};

const setPreview = (element: Element, preview: string) => {
  if (element.getAttribute(previewAttribute) === preview) {
    return;
  }

  element.setAttribute(previewAttribute, preview);
};

const walk = (data: JSONValue, element: Element) => {
  if (!isObjectNode(data)) {
    return;
  }

  const content = element.querySelector(':scope > .pushed-content > .object-content');

  if (!content) {
    const ellipsis = element.querySelector(':scope > .node-ellipsis');

    if (ellipsis) {
      setPreview(ellipsis, getNodePreview(data));
    }

    return;
  }

  const values = Object.values(data);
  const rows = Array.from(content.children);

  if (rows.length !== values.length) {
    return;
  }

  rows.forEach((row, index) => {
    if (row.classList.contains('object-key-val') && !row.classList.contains('array-group')) {
      walk(values[index], row);
    }
  });
};

const useCollapsedPreview = (
  containerRef: RefObject<HTMLElement>,
  src: JSONValue,
  isEnabled: boolean
) => {
  useEffect(() => {
    const container = containerRef.current;

    if (!isEnabled || !container) {
      return undefined;
    }

    const apply = () => {
      const root = container.querySelector('.object-key-val');

      if (root) {
        walk(src, root);
      }
    };

    apply();

    const observer = new MutationObserver(apply);

    observer.observe(container, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [containerRef, src, isEnabled]);
};

export default useCollapsedPreview;
