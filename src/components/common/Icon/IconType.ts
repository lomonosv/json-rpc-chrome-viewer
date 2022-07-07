// TODO: Splitting build option for esbuild is still experimental.
//  So dynamic imports can't be used.
//  The question is do it really useful to use it dynamically in chrome extension.
//  Need to consider migration to Webpack or leave it as is.

import settings from './icons/settings.svg';
import close from './icons/close.svg';

export enum IconType {
  Settings,
  Close
}

export const IconMap = {
  [IconType.Settings]: settings,
  [IconType.Close]: close
};
