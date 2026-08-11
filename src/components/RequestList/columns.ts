import React from 'react';
import { SortField } from '~/logic/HTTPArchive/SortField';

export type ResizableColumn =
  SortField.Waterfall |
  SortField.Status |
  SortField.Size |
  SortField.Time;

export const defaultColumnOrder: ResizableColumn[] = [
  SortField.Waterfall,
  SortField.Status,
  SortField.Size,
  SortField.Time
];

export const columnLabels: Record<ResizableColumn, string> = {
  [SortField.Waterfall]: 'Waterfall',
  [SortField.Status]: 'Status',
  [SortField.Size]: 'Size (B)',
  [SortField.Time]: 'Time (ms)'
};

export const normaliseColumnOrder = (stored: ResizableColumn[]): ResizableColumn[] => {
  const known = (Array.isArray(stored) ? stored : []).filter(
    (field) => defaultColumnOrder.includes(field)
  );
  const unique = [...new Set(known)];

  return [...unique, ...defaultColumnOrder.filter((field) => !unique.includes(field))];
};

export const moveColumn = (
  order: ResizableColumn[],
  field: ResizableColumn,
  targetIndex: number
): ResizableColumn[] => {
  const next = order.filter((item) => item !== field);

  next.splice(targetIndex, 0, field);

  return next;
};

export const defaultColumnWidths: Record<ResizableColumn, number> = {
  [SortField.Waterfall]: 150,
  [SortField.Status]: 82,
  [SortField.Size]: 82,
  [SortField.Time]: 82
};

const minColumnWidths: Record<ResizableColumn, number> = {
  [SortField.Waterfall]: 80,
  [SortField.Status]: 72,
  [SortField.Size]: 72,
  [SortField.Time]: 72
};

const maxColumnWidth = 800;

export const clampColumnWidth = (field: ResizableColumn, width: number): number => (
  Math.round(Math.min(Math.max(width, minColumnWidths[field]), maxColumnWidth))
);

export const getColumnWidthVar = (field: ResizableColumn): string => (
  `--column-${ field.toLowerCase() }`
);

export const getColumnWidthStyle = (field: ResizableColumn): React.CSSProperties => ({
  width: `var(${ getColumnWidthVar(field) })`
});

export const getColumnWidthProperties = (
  widths: Record<ResizableColumn, number>
): React.CSSProperties => Object.fromEntries(
  Object.entries(widths).map(([field, width]) => [
    getColumnWidthVar(field as ResizableColumn),
    `${ width }px`
  ])
) as React.CSSProperties;
