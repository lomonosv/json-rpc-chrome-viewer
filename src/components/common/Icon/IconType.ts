// TODO: Splitting build option for esbuild is still experimental.
//  So dynamic imports can't be used.
//  The question is do it really useful to use it dynamically in chrome extension.
//  Need to consider migration to Webpack or leave it as is.

import settings from './icons/settings.svg';
import close from './icons/close.svg';
import clear from './icons/clear.svg';
import expand from './icons/expand.svg';
import collapse from './icons/collapse.svg';
import copy from './icons/copy.svg';
import typescript from './icons/typescript.svg';

export enum IconType {
  Settings,
  Close,
  Clear,
  Expand,
  Collapse,
  Copy,
  Typescript
}

export const IconMap = {
  [IconType.Settings]: settings,
  [IconType.Close]: close,
  [IconType.Clear]: clear,
  [IconType.Expand]: expand,
  [IconType.Collapse]: collapse,
  [IconType.Copy]: copy,
  [IconType.Typescript]: typescript
};
