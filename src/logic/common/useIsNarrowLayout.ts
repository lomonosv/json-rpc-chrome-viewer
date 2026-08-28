import useMediaQuery from './useMediaQuery';
import { narrowQuery } from './breakpoints';

const useIsNarrowLayout = (): boolean => useMediaQuery(narrowQuery);

export default useIsNarrowLayout;
