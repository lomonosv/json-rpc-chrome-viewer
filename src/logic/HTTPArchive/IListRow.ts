import { IRequest } from '~/logic/HTTPArchive/IRequest';

export interface IServerGroup {
  id: string,
  carrierStart: number,
  label: string,
  count: number,
  isExpanded: boolean,
}

export type IListRow =
  | { kind: 'group', group: IServerGroup }
  | { kind: 'request', request: IRequest };
