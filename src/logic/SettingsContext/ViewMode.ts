export enum ViewMode {
  Auto = 'auto',
  Panes = 'panes',
  Stacked = 'stacked',
  Drawer = 'drawer',
  DrillDown = 'drillDown',
  Accordion = 'accordion',
}

export const viewModeLabels: Record<ViewMode, string> = {
  [ViewMode.Auto]: 'Auto',
  [ViewMode.Panes]: 'Panes',
  [ViewMode.Stacked]: 'Stacked',
  [ViewMode.Drawer]: 'Drawer',
  [ViewMode.DrillDown]: 'Drill-down',
  [ViewMode.Accordion]: 'Accordion'
};

export const viewModeOptions: { key: ViewMode, value: string }[] = Object.values(ViewMode)
  .map((key) => ({ key, value: viewModeLabels[key] }));

export const isViewMode = (value: unknown): value is ViewMode => (
  Object.values(ViewMode).includes(value as ViewMode)
);
