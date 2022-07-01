// TODO: Splitting build option for esbuild is still experimental.
// TODO: So dynamic imports can't be used. Need to consider migration to Webpack.
import settings from './icons/settings.svg';

export enum IconType {
  Settings = 'settings'
}

export const IconMap = {
  [IconType.Settings]: settings
};
