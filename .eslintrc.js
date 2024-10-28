module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json'
  },
  extends: [
    'airbnb-base',
    '@kesills/airbnb-typescript',
    'plugin:react/recommended'
  ],
  plugins: [
    '@typescript-eslint',
    '@stylistic'
  ],
  settings: {
    react: {
      version: 'detect'
    }
  },
  rules: {
    '@stylistic/comma-dangle': ['warn', 'never'],
    'import/prefer-default-export': 'off',
    'import/extensions': 'off',
    '@typescript-eslint/no-shadow': 'off',
    '@typescript-eslint/no-unused-expressions': 'off',
    'react/display-name': 'off',
    'react/prop-types': 'off',
    'import/no-named-as-default': 'off',
    'object-curly-newline': 'off',
    'template-curly-spacing': ['warn', 'always'],
    'react/jsx-curly-spacing': ['warn', 'always'],
    'max-len': ['warn', { 'code': 120 }],
    'operator-linebreak': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { 'caughtErrors': 'none' }]
  }
};
