import { useSettingsContext } from '~/logic/SettingsContext/SettingsContext';
import { ViewMode } from '~/logic/SettingsContext/ViewMode';
import useIsNarrowLayout from './useIsNarrowLayout';

const useIsAccordionView = (): boolean => {
  const { viewMode } = useSettingsContext();
  const isNarrowLayout = useIsNarrowLayout();

  return viewMode === ViewMode.Accordion || isNarrowLayout;
};

export default useIsAccordionView;
