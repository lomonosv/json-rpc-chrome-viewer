import { RefObject, useEffect } from 'react';

const highlightName = 'json-rpc-namespace';
const maxRanges = 2000;

// Up to and including the last dot: `user.` of `user.get`.
const namespacePattern = /^.+\.(?=[^.]+$)/;

const isSupported = () => typeof Highlight !== 'undefined' && !!CSS?.highlights;

/**
 * Tints each method label's namespace via the CSS Custom Highlight API, not a
 * <span>, so search can still match across the boundary.
 */
const useNamespaceHighlight = (ref: RefObject<HTMLElement>) => {
  useEffect(() => {
    if (!isSupported()) {
      return undefined;
    }

    let frame = 0;

    const apply = () => {
      const labels = ref.current?.querySelectorAll('[data-method-label]') ?? [];
      const ranges: Range[] = [];

      labels.forEach((label) => {
        const text = label.firstChild;
        const match = text?.nodeType === Node.TEXT_NODE && namespacePattern.exec(text.textContent || '');

        if (match && ranges.length < maxRanges) {
          const range = new Range();

          range.setStart(text, 0);
          range.setEnd(text, match[0].length);
          ranges.push(range);
        }
      });

      if (!ranges.length) {
        CSS.highlights.delete(highlightName);
        return;
      }

      const highlight = new Highlight(...ranges);

      // Below search (priority 0), so a search match paints over the tint.
      highlight.priority = -1;
      CSS.highlights.set(highlightName, highlight);
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
      CSS.highlights.delete(highlightName);
    };
  }, [ref]);
};

export default useNamespaceHighlight;
