import { useSettingsContext } from '~/logic/SettingsContext/SettingsContext';
import { ViewMode } from '~/logic/SettingsContext/ViewMode';
import useMediaQuery from './useMediaQuery';
import { compactQuery, portraitQuery } from './breakpoints';
import useIsNarrowLayout from './useIsNarrowLayout';

// The layout actually rendered, never Auto.
const useEffectiveViewMode = (): ViewMode => {
  const { viewMode } = useSettingsContext();
  const isNarrowLayout = useIsNarrowLayout();
  const isCompactLayout = useMediaQuery(compactQuery);
  const isPortrait = useMediaQuery(portraitQuery);
  if (viewMode === ViewMode.Auto) {
    if (isCompactLayout) {
      return ViewMode.DrillDown;
    }

    return isNarrowLayout || isPortrait ? ViewMode.Stacked : ViewMode.Panes;
  }

  if (isNarrowLayout && (viewMode === ViewMode.Panes || viewMode === ViewMode.Drawer)) {
    return ViewMode.Stacked;
  }

  return viewMode;
};

export default useEffectiveViewMode;
