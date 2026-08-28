import { useCacheContext } from '~/logic/CacheContext/CacheContext';
import { useSettingsContext } from '~/logic/SettingsContext/SettingsContext';
import useIsNarrowLayout from '~/logic/common/useIsNarrowLayout';
import { SortField } from '~/logic/HTTPArchive/SortField';
import { ResizableColumn } from './columns';

const useVisibleColumns = (): ResizableColumn[] => {
  const { columnOrder } = useCacheContext();
  const {
    showWaterfallColumn,
    showStatusColumn,
    showSizeColumn,
    showTimeColumn
  } = useSettingsContext();
  const isNarrowLayout = useIsNarrowLayout();

  const isColumnVisible: Record<ResizableColumn, boolean> = {
    [SortField.Waterfall]: showWaterfallColumn,
    [SortField.Status]: showStatusColumn,
    [SortField.Size]: showSizeColumn,
    [SortField.Time]: showTimeColumn
  };

  if (isNarrowLayout) {
    return [];
  }

  return columnOrder.filter((field) => isColumnVisible[field]);
};

export default useVisibleColumns;
