module.exports = {
  customSyntax: 'postcss-scss',
  plugins: ['stylelint-scss'],
  extends: 'stylelint-config-standard',
  rules: {
    'at-rule-no-unknown': null,
    'scss/at-rule-no-unknown': true,
    'selector-pseudo-class-no-unknown': [
      true,
      {
        ignorePseudoClasses: ['global']
      }
    ],
    'selector-class-pattern': null,
    'no-descending-specificity': null,
    'media-query-no-invalid': null,
    'import-notation': 'string',
    // Sass-aware variant: the core rule cannot parse values with Sass variables.
    'declaration-property-value-no-unknown': null,
    'scss/declaration-property-value-no-unknown': true
  }
};
