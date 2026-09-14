export enum ServerGroupState {
  Collapsed = 'collapsed',
  Expanded = 'expanded',
}

export const serverGroupStateOptions: { key: ServerGroupState, value: string }[] = [
  { key: ServerGroupState.Collapsed, value: 'Collapsed' },
  { key: ServerGroupState.Expanded, value: 'Expanded' }
];
