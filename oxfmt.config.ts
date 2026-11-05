import { defineConfig } from 'oxfmt';

export default defineConfig({
  printWidth: 120,
  singleQuote: true,
  trailingComma: 'none',
  sortPackageJson: false,
  ignorePatterns: ['pnpm-lock.yaml', 'packages/site/src/components/reactbits/**']
});
