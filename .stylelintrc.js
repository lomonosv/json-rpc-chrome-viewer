module.exports = {
  customSyntax: 'postcss-scss',
  plugins: [
    'stylelint-scss'
  ],
  extends: 'stylelint-config-standard',
  rules: {
    'at-rule-no-unknown': null,
    'scss/at-rule-no-unknown': true,
    'selector-pseudo-class-no-unknown': [true, {
      ignorePseudoClasses: ['global']
    }],
    'selector-class-pattern': null,
    'no-descending-specificity': null,
    'import-notation': 'string'
  }
}
