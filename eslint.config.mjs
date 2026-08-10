import { configs, plugins } from 'eslint-config-airbnb-extended';

export default [
  plugins.stylistic,
  plugins.importX,
  plugins.react,
  plugins.reactA11y,
  plugins.reactHooks,
  plugins.typescriptEslint,
  {
    ignores: [
      '.cache/**',
      'build/**',
      'static/**',
      'scripts/**',
      'node_modules/**'
    ]
  },
  ...configs.base.recommended,
  ...configs.base.typescript,
  ...configs.react.recommended,
  ...configs.react.typescript,
  {
    settings: {
      react: {
        version: 'detect'
      }
    },
    rules: {
      '@stylistic/comma-dangle': ['warn', 'only-multiline'],
      'import-x/prefer-default-export': 'off',
      'import-x/extensions': 'off',
      '@typescript-eslint/no-shadow': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      'react/display-name': 'off',
      'react/prop-types': 'off',
      'import-x/no-named-as-default': 'off',
      '@stylistic/object-curly-newline': 'off',
      '@stylistic/template-curly-spacing': ['warn', 'always'],
      '@stylistic/jsx-curly-spacing': ['warn', 'always'],
      'react/jsx-curly-spacing': ['warn', 'always'],
      // The codebase consistently uses commas as interface/type member delimiters.
      '@stylistic/member-delimiter-style': ['warn', {
        multiline: { delimiter: 'comma', requireLast: false },
        singleline: { delimiter: 'comma', requireLast: false }
      }],
      '@stylistic/max-len': ['warn', { code: 120 }],
      '@stylistic/operator-linebreak': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { caughtErrors: 'none' }],
      'no-param-reassign': 'off',

      // Project conventions that differ from Airbnb's React config.
      'react/function-component-definition': 'off',
      'react/require-default-props': 'off',
      'react/destructuring-assignment': 'off',
      'react/jsx-one-expression-per-line': 'off',
      'react/jsx-indent': 'off',
      'react/jsx-indent-props': 'off',
      'react/jsx-tag-spacing': 'off',
      'react/jsx-closing-bracket-location': 'off',
      'react/self-closing-comp': 'off',
      'react/no-array-index-key': 'off',
      'react/no-danger': 'off',
      'import-x/no-rename-default': 'off',
      'import-x/order': 'off',
      '@stylistic/type-annotation-spacing': 'off',
      '@typescript-eslint/no-unsafe-enum-comparison': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',

      // Not previously linted: surfaced as warnings rather than enforced.
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
      'jsx-a11y/anchor-is-valid': 'warn'
    }
  },
  {
    // Root-level CommonJS tooling config files.
    files: ['*.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        module: 'writable',
        require: 'readonly',
        process: 'readonly',
        __dirname: 'readonly'
      }
    },
    rules: {
      '@stylistic/quote-props': 'off',
      'no-template-curly-in-string': 'off'
    }
  }
];
