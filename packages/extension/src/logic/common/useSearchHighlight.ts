import { RefObject, useEffect } from 'react';

export enum HighlightName {
  List = 'json-rpc-search-list',
  Request = 'json-rpc-search-request',
  Response = 'json-rpc-search-response',
  Message = 'json-rpc-search-message',
}

const maxRanges = 2000;

const isSupported = () => typeof Highlight !== 'undefined' && !!CSS?.highlights;

const collectRanges = (
  root: Node,
  needle: string,
  isCaseSensitive: boolean,
  skipSelector?: string
): Range[] => {
  const ranges: Range[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const target = isCaseSensitive ? needle : needle.toLowerCase();

  let node = walker.nextNode();

  while (node && ranges.length < maxRanges) {
    const isSkipped = skipSelector && (node.parentElement?.closest(skipSelector));
    const content = node.textContent || '';
    const haystack = isCaseSensitive ? content : content.toLowerCase();

    let index = isSkipped ? -1 : haystack.indexOf(target);

    while (index !== -1 && ranges.length < maxRanges) {
      const range = new Range();

      range.setStart(node, index);
      range.setEnd(node, index + target.length);
      ranges.push(range);

      index = haystack.indexOf(target, index + target.length);
    }

    node = walker.nextNode();
  }

  return ranges;
};

const useSearchHighlight = (
  ref: RefObject<HTMLElement>,
  name: HighlightName,
  needle: string,
  isCaseSensitive: boolean,
  skipSelector?: string
) => {
  useEffect(() => {
    if (!isSupported()) {
      return undefined;
    }

    let frame = 0;

    const apply = () => {
      const ranges = ref.current && needle
        ? collectRanges(ref.current, needle, isCaseSensitive, skipSelector)
        : [];

      if (!ranges.length) {
        CSS.highlights.delete(name);
        return;
      }

      CSS.highlights.set(name, new Highlight(...ranges));
    };

    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(apply);
    };

    schedule();

    const observer = new MutationObserver(schedule);

    if (ref.current) {
      observer.observe(ref.current, { childList: true, subtree: true, characterData: true });
    }

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      CSS.highlights.delete(name);
    };
  }, [ref, name, needle, isCaseSensitive, skipSelector]);
};

export default useSearchHighlight;
