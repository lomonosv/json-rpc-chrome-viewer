module.exports = {
  customSyntax: 'postcss-scss',
  plugins: [
    'stylelint-scss'
  ],
  extends: 'stylelint-config-standard',
  rules: {
    'selector-pseudo-class-no-unknown': [true, {
      ignorePseudoClasses: ['global']
    }],
    'at-rule-no-unknown': [true, {
      ignoreAtRules: ['mixin', 'include']
    }],
    'selector-class-pattern': null,
    'no-descending-specificity': null,
    'import-notation': 'string'
  }
}
