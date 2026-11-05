import React, { useEffect, useRef, useState } from 'react';
import { ResizableColumn } from './columns';

const dragThresholdPx = 4;

interface IDragState {
  field: ResizableColumn,
  startX: number,
  hasMoved: boolean,
}

const useColumnReorder = (
  order: ResizableColumn[],
  visibleColumns: ResizableColumn[],
  onReorder: (field: ResizableColumn, targetIndex: number) => void
) => {
  const dragRef = useRef<IDragState>(null);
  const headerRefs = useRef<Map<ResizableColumn, HTMLElement>>(new Map());
  const suppressClickRef = useRef(false);
  const [draggingField, setDraggingField] = useState<ResizableColumn>(null);
  const [dropIndex, setDropIndex] = useState<number>(null);

  useEffect(() => {
    if (!draggingField) {
      return undefined;
    }

    const { cursor, userSelect } = document.body.style;

    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';

    return () => {
      document.body.style.cursor = cursor;
      document.body.style.userSelect = userSelect;
    };
  }, [draggingField]);

  const registerHeader = (field: ResizableColumn) => (element: HTMLElement) => {
    if (element) {
      headerRefs.current.set(field, element);
      return;
    }

    headerRefs.current.delete(field);
  };

  const getDropIndex = (clientX: number): number => {
    const slots = visibleColumns
      .map((field) => ({ field, element: headerRefs.current.get(field) }))
      .filter(({ element }) => !!element);

    const index = slots.findIndex(({ element }) => {
      const rect = element.getBoundingClientRect();

      return clientX < rect.left + rect.width / 2;
    });

    return index === -1 ? slots.length : index;
  };

  const handlePointerDown = (field: ResizableColumn) => (e: React.PointerEvent<HTMLElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { field, startX: e.clientX, hasMoved: false };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;

    if (!drag) {
      return;
    }

    if (!drag.hasMoved && Math.abs(e.clientX - drag.startX) <= dragThresholdPx) {
      return;
    }

    drag.hasMoved = true;
    setDraggingField(drag.field);
    setDropIndex(getDropIndex(e.clientX));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;

    if (!drag) {
      return;
    }

    e.currentTarget.releasePointerCapture(e.pointerId);
    suppressClickRef.current = drag.hasMoved;

    if (drag.hasMoved) {
      const target = getDropIndex(e.clientX);
      const from = order.indexOf(drag.field);
      const targetIndex = target > from ? target - 1 : target;

      if (targetIndex !== from) {
        onReorder(drag.field, targetIndex);
      }
    }

    dragRef.current = null;
    setDraggingField(null);
    setDropIndex(null);
  };

  const getReorderProps = (field: ResizableColumn) => ({
    ref: registerHeader(field),
    onPointerDown: handlePointerDown(field),
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
    onPointerCancel: handlePointerUp
  });

  const consumeClickSuppression = (): boolean => {
    const shouldSuppress = suppressClickRef.current;

    suppressClickRef.current = false;

    return shouldSuppress;
  };

  return { draggingField, dropIndex, getReorderProps, consumeClickSuppression };
};

export default useColumnReorder;
