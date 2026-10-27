import type { ThemeObject } from '@microlink/react-json-view';

// The "System" theme. react-json-view applies it inline, and inline styles
// accept var(), so one object follows both panel themes.
export const panelJsonTheme: ThemeObject = {
  base00: 'transparent', // background - the pane shows through
  base01: 'var(--jr-text)', // edit popover text and icons
  base02: 'var(--jr-border)', // nested-object guide lines
  base03: 'var(--jr-text-dim)',
  base04: 'var(--jr-text-dim)', // object size
  base05: 'var(--jr-text-muted)', // undefined
  base06: 'var(--jr-text-muted)',
  base07: 'var(--jr-json-key)', // keys and braces
  base08: 'var(--jr-red)', // NaN, validation failure
  base09: 'var(--jr-json-string)', // strings, ellipsis
  base0A: 'var(--jr-json-literal)', // null
  base0B: 'var(--jr-json-number)', // floats
  base0C: 'var(--jr-text-dim)', // array indices
  base0D: 'var(--jr-accent)', // expanded icon
  base0E: 'var(--jr-json-literal)', // booleans, collapsed icon
  base0F: 'var(--jr-json-number)' // integers
};
