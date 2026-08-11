import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { getConfig } from '~/logic/common/helpers';
import {
  ResizableColumn,
  defaultColumnWidths,
  defaultColumnOrder,
  normaliseColumnOrder,
  moveColumn,
  clampColumnWidth
} from '~/components/RequestList/columns';

const defaultRequestSectionHeight = 115;
const defaultRequestListSectionWidth = 200;

const useCache = () => {
  const [requestSectionHeight, setRequestSectionHeight] = useState<number>(defaultRequestSectionHeight);
  const [requestListSectionWidth, setRequestListSectionWidth] = useState<number>(defaultRequestListSectionWidth);
  const [columnWidths, setColumnWidths] = useState<Record<ResizableColumn, number>>(defaultColumnWidths);
  const columnWidthsRef = useRef<Record<ResizableColumn, number>>(defaultColumnWidths);
  const [columnOrder, setColumnOrder] = useState<ResizableColumn[]>(defaultColumnOrder);
  const columnOrderRef = useRef<ResizableColumn[]>(defaultColumnOrder);

  useEffect(() => {
    getConfig('requestSectionHeight', defaultRequestSectionHeight).then(setRequestSectionHeight);
    getConfig('requestListSectionWidth', defaultRequestListSectionWidth).then(setRequestListSectionWidth);
    getConfig('columnWidths', defaultColumnWidths).then((stored) => {
      const merged = { ...defaultColumnWidths, ...(stored as Record<ResizableColumn, number>) };

      Object.keys(merged).forEach((field: ResizableColumn) => {
        merged[field] = clampColumnWidth(field, merged[field]);
      });

      columnWidthsRef.current = merged;
      setColumnWidths(merged);
    });
    getConfig('columnOrder', defaultColumnOrder).then((stored) => {
      const order = normaliseColumnOrder(stored as ResizableColumn[]);

      columnOrderRef.current = order;
      setColumnOrder(order);
    });
  }, []);

  const updateRequestSectionHeight = (requestSectionHeight) => {
    setRequestSectionHeight(requestSectionHeight);
    chrome.storage.local.set({ requestSectionHeight });
  };

  const updateRequestListSectionWidth = (requestListSectionWidth) => {
    setRequestListSectionWidth(requestListSectionWidth);
    chrome.storage.local.set({ requestListSectionWidth });
  };

  const getColumnWidth = (field: ResizableColumn) => columnWidthsRef.current[field];

  const setColumnWidth = (field: ResizableColumn, width: number) => {
    columnWidthsRef.current = { ...columnWidthsRef.current, [field]: width };
    setColumnWidths(columnWidthsRef.current);
  };

  const persistColumnWidths = () => {
    chrome.storage.local.set({ columnWidths: columnWidthsRef.current });
  };

  const updateColumnOrder = (field: ResizableColumn, targetIndex: number) => {
    const columnOrder = moveColumn(columnOrderRef.current, field, targetIndex);

    columnOrderRef.current = columnOrder;
    setColumnOrder(columnOrder);
    chrome.storage.local.set({ columnOrder });
  };

  return {
    requestSectionHeight,
    updateRequestSectionHeight,
    requestListSectionWidth,
    updateRequestListSectionWidth,
    columnWidths,
    getColumnWidth,
    setColumnWidth,
    persistColumnWidths,
    columnOrder,
    updateColumnOrder
  };
};

type CacheContextType = ReturnType<typeof useCache>;

export const CacheContext = createContext<CacheContextType>(null);

export const useCacheContext = (): CacheContextType => (
  useContext<CacheContextType>(CacheContext)
);

interface IComponentProps {
  children: React.ReactElement,
}

const CacheContextProvider: React.FC<IComponentProps> = ({ children }) => (
  <CacheContext.Provider value={ useCache() }>
    { children }
  </CacheContext.Provider>
);

export default CacheContextProvider;
