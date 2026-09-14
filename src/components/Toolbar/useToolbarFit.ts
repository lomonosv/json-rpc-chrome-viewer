import { RefObject, useLayoutEffect, useState } from 'react';

const comfortableFilterWidth = 130;

const getOuterWidth = (element: Element): number => {
  const { marginLeft, marginRight } = getComputedStyle(element);

  return element.getBoundingClientRect().width
    + Number.parseFloat(marginLeft)
    + Number.parseFloat(marginRight);
};

const useToolbarFit = (
  sectionRef: RefObject<HTMLElement>,
  filterRef: RefObject<HTMLElement>,
  optionalRefs: RefObject<HTMLElement>[]
): number => {
  const [visibleCount, setVisibleCount] = useState<number>(optionalRefs.length);

  useLayoutEffect(() => {
    const section = sectionRef.current;

    if (!section || typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const measure = () => {
      const optionalItems = optionalRefs.map((ref) => ref.current?.parentElement).filter(Boolean);
      const filterWrapper = filterRef.current?.parentElement;
      const fixedWidth = Array.from(section.children).reduce((total, child) => {
        if (optionalItems.includes(child as HTMLElement)) {
          return total;
        }

        return total + (child === filterWrapper ? comfortableFilterWidth : getOuterWidth(child));
      }, 0);
      const availableWidth = section.clientWidth;
      const { count } = optionalItems.reduce((fit, item) => {
        if (fit.isFull) {
          return fit;
        }

        const used = fit.used + getOuterWidth(item);

        return used > availableWidth
          ? { ...fit, isFull: true }
          : { used, count: fit.count + 1, isFull: false };
      }, { used: fixedWidth, count: 0, isFull: false });

      setVisibleCount(count);
    };

    const observer = new ResizeObserver(measure);

    observer.observe(section);
    Array.from(section.children).forEach((child) => observer.observe(child));
    measure();
    document.fonts?.ready.then(measure);

    return () => observer.disconnect();
  }, []);

  return visibleCount;
};

export default useToolbarFit;
