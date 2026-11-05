import React, { useEffect, useRef, useState } from 'react';
import { ResizableColumn, clampColumnWidth } from './columns';

const dragThresholdPx = 3;

interface IDragState {
  field: ResizableColumn,
  startX: number,
  startWidth: number,
  hasMoved: boolean,
}

const useColumnResize = (
  getWidth: (field: ResizableColumn) => number,
  onResize: (field: ResizableColumn, width: number) => void,
  onResizeEnd: () => void
) => {
  const dragRef = useRef<IDragState>(null);

  const suppressClickRef = useRef(false);
  const [resizingField, setResizingField] = useState<ResizableColumn>(null);

  useEffect(() => {
    if (!resizingField) {
      return undefined;
    }

    const { cursor, userSelect } = document.body.style;

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.body.style.cursor = cursor;
      document.body.style.userSelect = userSelect;
    };
  }, [resizingField]);

  const handlePointerDown = (field: ResizableColumn) => (e: React.PointerEvent<HTMLSpanElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);

    dragRef.current = {
      field,
      startX: e.clientX,
      startWidth: getWidth(field),
      hasMoved: false
    };

    setResizingField(field);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLSpanElement>) => {
    const drag = dragRef.current;

    if (!drag) {
      return;
    }

    const delta = drag.startX - e.clientX;

    if (Math.abs(delta) > dragThresholdPx) {
      drag.hasMoved = true;
    }

    onResize(drag.field, clampColumnWidth(drag.field, drag.startWidth + delta));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLSpanElement>) => {
    const drag = dragRef.current;

    if (!drag) {
      return;
    }

    e.currentTarget.releasePointerCapture(e.pointerId);
    suppressClickRef.current = drag.hasMoved;
    dragRef.current = null;
    setResizingField(null);

    if (drag.hasMoved) {
      onResizeEnd();
    }
  };

  const getResizeHandleProps = (field: ResizableColumn) => ({
    onPointerDown: handlePointerDown(field),
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
    onPointerCancel: handlePointerUp,
    onClick: (e: React.MouseEvent) => e.stopPropagation()
  });

  const consumeClickSuppression = (): boolean => {
    const shouldSuppress = suppressClickRef.current;

    suppressClickRef.current = false;

    return shouldSuppress;
  };

  return { resizingField, getResizeHandleProps, consumeClickSuppression };
};

export default useColumnResize;
