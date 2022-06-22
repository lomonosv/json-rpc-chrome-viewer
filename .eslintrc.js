module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json'
  },
  extends: [
    'airbnb-base',
    'airbnb-typescript',
    'plugin:react/recommended'
  ],
  plugins: [
    '@typescript-eslint'
  ],
  settings: {
    react: {
      version: 'detect'
    }
  },
  rules: {
    "import/no-named-as-default": "off"
  }
};
