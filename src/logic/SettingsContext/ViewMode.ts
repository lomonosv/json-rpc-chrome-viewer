export enum ViewMode {
  Panes = 'panes',
  Accordion = 'accordion',
}

export const viewModeOptions: { key: ViewMode, value: string }[] = [
  { key: ViewMode.Panes, value: 'Panes' },
  { key: ViewMode.Accordion, value: 'Accordion' }
];
