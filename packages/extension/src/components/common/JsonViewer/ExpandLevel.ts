export const expandAllLevels = 0;

const maxExpandLevel = 10;

export const expandLevelOptions: { key: number, value: string }[] = [
  { key: expandAllLevels, value: 'All' },
  ...Array.from({ length: maxExpandLevel }, (_, index) => ({
    key: index + 1,
    value: String(index + 1)
  }))
];
