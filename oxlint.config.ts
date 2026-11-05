import { defineConfig } from 'oxlint';

export default defineConfig({
  plugins: ['import', 'typescript', 'react', 'jsx-a11y'],
  categories: {
    correctness: 'error'
  },
  options: {
    typeAware: true
  },
  env: {
    builtin: true,
    es2022: true,
    browser: true
  },
  settings: {
    react: {
      version: '19.3'
    }
  },
  ignorePatterns: [
    '**/.cache/**',
    '**/node_modules/**',
    'packages/extension/build/**',
    'packages/extension/static/**',
    'packages/*/dist/**',
    'packages/*/scripts/**',
    'packages/site/.next/**',
    'packages/site/out/**',
    'packages/site/next-env.d.ts',
    'packages/site/demo/**',
    'packages/site/public/demo/**',
    'packages/site/src/components/reactbits/**'
  ],
  rules: {
    'array-callback-return': [
      'error',
      {
        allowImplicit: true
      }
    ],
    'arrow-body-style': [
      'error',
      'as-needed',
      {
        requireReturnForObjectLiteral: false
      }
    ],
    'block-scoped-var': 'error',
    'class-methods-use-this': [
      'error',
      {
        exceptMethods: [
          'render',
          'getInitialState',
          'getDefaultProps',
          'getChildContext',
          'componentWillMount',
          'UNSAFE_componentWillMount',
          'componentDidMount',
          'componentWillReceiveProps',
          'UNSAFE_componentWillReceiveProps',
          'shouldComponentUpdate',
          'componentWillUpdate',
          'UNSAFE_componentWillUpdate',
          'componentDidUpdate',
          'componentWillUnmount',
          'componentDidCatch',
          'getSnapshotBeforeUpdate'
        ]
      }
    ],
    'constructor-super': 'error',
    curly: ['error', 'multi-line'],
    'default-case': [
      'error',
      {
        commentPattern: '^no default$'
      }
    ],
    'default-case-last': 'error',
    'default-param-last': 'error',
    eqeqeq: [
      'error',
      'always',
      {
        null: 'ignore'
      }
    ],
    'for-direction': 'error',
    'func-names': 'warn',
    'getter-return': [
      'error',
      {
        allowImplicit: true
      }
    ],
    'grouped-accessor-pairs': 'error',
    'guard-for-in': 'error',
    'import/default': 'error',
    'import/first': 'error',
    'import/namespace': 'error',
    'import/newline-after-import': 'error',
    'import/no-absolute-path': 'error',
    'import/no-amd': 'error',
    'import/no-cycle': ['error', {}],
    'import/no-duplicates': 'error',
    'import/no-dynamic-require': 'error',
    'import/no-empty-named-blocks': 'error',
    'import/no-mutable-exports': 'error',
    'import/no-named-as-default-member': 'error',
    'import/no-named-default': 'error',
    'import/no-self-import': 'error',
    'import/no-webpack-loader-syntax': 'error',
    'jsx-a11y/alt-text': [
      'error',
      {
        elements: ['img', 'object', 'area', 'input[type="image"]'],
        img: [],
        object: [],
        area: [],
        'input[type="image"]': []
      }
    ],
    'jsx-a11y/anchor-has-content': [
      'error',
      {
        components: []
      }
    ],
    'jsx-a11y/anchor-is-valid': 'off',
    'jsx-a11y/aria-activedescendant-has-tabindex': 'error',
    'jsx-a11y/aria-props': 'error',
    'jsx-a11y/aria-proptypes': 'error',
    'jsx-a11y/aria-role': [
      'error',
      {
        ignoreNonDOM: false
      }
    ],
    'jsx-a11y/aria-unsupported-elements': 'error',
    'jsx-a11y/autocomplete-valid': [
      'error',
      {
        inputComponents: ['Input']
      }
    ],
    'jsx-a11y/click-events-have-key-events': 'off',
    'jsx-a11y/control-has-associated-label': [
      'error',
      {
        labelAttributes: ['label'],
        controlComponents: [],
        ignoreElements: ['audio', 'canvas', 'embed', 'input', 'textarea', 'tr', 'video'],
        ignoreRoles: [
          'grid',
          'listbox',
          'menu',
          'menubar',
          'radiogroup',
          'row',
          'tablist',
          'toolbar',
          'tree',
          'treegrid'
        ],
        depth: 5
      }
    ],
    'jsx-a11y/heading-has-content': [
      'error',
      {
        components: ['Typography', 'Text']
      }
    ],
    'jsx-a11y/html-has-lang': 'error',
    'jsx-a11y/iframe-has-title': 'error',
    'jsx-a11y/img-redundant-alt': 'error',
    'jsx-a11y/interactive-supports-focus': 'error',
    'jsx-a11y/label-has-associated-control': [
      'error',
      {
        controlComponents: ['Select']
      }
    ],
    'jsx-a11y/lang': 'error',
    'jsx-a11y/media-has-caption': [
      'error',
      {
        audio: [],
        video: [],
        track: []
      }
    ],
    'jsx-a11y/mouse-events-have-key-events': 'error',
    'jsx-a11y/no-access-key': 'error',
    'jsx-a11y/no-aria-hidden-on-focusable': 'off',
    'jsx-a11y/no-autofocus': [
      'error',
      {
        ignoreNonDOM: true
      }
    ],
    'jsx-a11y/no-distracting-elements': [
      'error',
      {
        elements: ['marquee', 'blink']
      }
    ],
    'jsx-a11y/no-interactive-element-to-noninteractive-role': [
      'error',
      {
        tr: ['none', 'presentation']
      }
    ],
    'jsx-a11y/no-noninteractive-element-interactions': [
      'error',
      {
        handlers: ['onClick', 'onMouseDown', 'onMouseUp', 'onKeyPress', 'onKeyDown', 'onKeyUp']
      }
    ],
    'jsx-a11y/no-noninteractive-element-to-interactive-role': [
      'error',
      {
        ul: ['listbox', 'menu', 'menubar', 'radiogroup', 'tablist', 'tree', 'treegrid'],
        ol: ['listbox', 'menu', 'menubar', 'radiogroup', 'tablist', 'tree', 'treegrid'],
        li: ['menuitem', 'option', 'row', 'tab', 'treeitem'],
        table: ['grid'],
        td: ['gridcell']
      }
    ],
    'jsx-a11y/no-noninteractive-tabindex': [
      'error',
      {
        tags: [],
        roles: ['tabpanel'],
        allowExpressionValues: true
      }
    ],
    'jsx-a11y/no-redundant-roles': [
      'error',
      {
        nav: ['navigation']
      }
    ],
    'jsx-a11y/no-static-element-interactions': 'off',
    'jsx-a11y/prefer-tag-over-role': 'off',
    'jsx-a11y/role-has-required-aria-props': 'error',
    'jsx-a11y/role-supports-aria-props': 'error',
    'jsx-a11y/scope': 'error',
    'jsx-a11y/tabindex-no-positive': 'error',
    'max-classes-per-file': ['error', 1],
    'new-cap': [
      'error',
      {
        newIsCap: true,
        newIsCapExceptions: [],
        capIsNew: false,
        capIsNewExceptions: ['Immutable.Map', 'Immutable.Set', 'Immutable.List']
      }
    ],
    'no-alert': 'warn',
    'no-array-constructor': 'error',
    'no-async-promise-executor': 'error',
    'no-await-in-loop': 'error',
    'no-bitwise': 'error',
    'no-caller': 'error',
    'no-case-declarations': 'error',
    'no-class-assign': 'error',
    'no-compare-neg-zero': 'error',
    'no-cond-assign': ['error', 'always'],
    'no-console': 'warn',
    'no-const-assign': 'error',
    'no-constant-binary-expression': 'off',
    'no-constant-condition': 'warn',
    'no-constructor-return': 'error',
    'no-continue': 'error',
    'no-control-regex': 'error',
    'no-debugger': 'error',
    'no-delete-var': 'error',
    'no-dupe-class-members': 'error',
    'no-dupe-else-if': 'error',
    'no-dupe-keys': 'error',
    'no-duplicate-case': 'error',
    'no-else-return': [
      'error',
      {
        allowElseIf: false
      }
    ],
    'no-empty': 'error',
    'no-empty-character-class': 'error',
    'no-empty-function': [
      'error',
      {
        allow: ['arrowFunctions', 'functions', 'methods']
      }
    ],
    'no-empty-pattern': 'error',
    'no-empty-static-block': 'off',
    'no-eval': 'error',
    'no-ex-assign': 'error',
    'no-extend-native': 'error',
    'no-extra-bind': 'error',
    'no-extra-boolean-cast': 'error',
    'no-extra-label': 'error',
    'no-fallthrough': 'error',
    'no-func-assign': 'error',
    'no-global-assign': [
      'error',
      {
        exceptions: []
      }
    ],
    'no-implied-eval': 'error',
    'no-import-assign': 'error',
    'no-inner-declarations': 'error',
    'no-invalid-regexp': 'error',
    'no-irregular-whitespace': 'error',
    'no-iterator': 'error',
    'no-label-var': 'error',
    'no-labels': [
      'error',
      {
        allowLoop: false,
        allowSwitch: false
      }
    ],
    'no-lone-blocks': 'error',
    'no-lonely-if': 'error',
    'no-loop-func': 'error',
    'no-loss-of-precision': 'error',
    'no-misleading-character-class': 'error',
    'no-multi-assign': 'error',
    'no-multi-str': 'error',
    'no-nested-ternary': 'error',
    'no-new': 'error',
    'no-new-func': 'error',
    'no-new-native-nonconstructor': 'error',
    'no-new-wrappers': 'error',
    'no-nonoctal-decimal-escape': 'error',
    'no-obj-calls': 'error',
    'no-plusplus': 'error',
    'no-promise-executor-return': 'error',
    'no-proto': 'error',
    'no-prototype-builtins': 'error',
    'no-redeclare': 'error',
    'no-regex-spaces': 'error',
    'no-restricted-globals': [
      'error',
      {
        name: 'isFinite',
        message: 'Use Number.isFinite instead https://github.com/airbnb/javascript#standard-library--isfinite'
      },
      {
        name: 'isNaN',
        message: 'Use Number.isNaN instead https://github.com/airbnb/javascript#standard-library--isnan'
      },
      {
        name: 'addEventListener',
        message:
          'Use window.addEventListener instead. https://github.com/facebook/create-react-app/blob/HEAD/packages/confusing-browser-globals/README.md'
      },
      {
        name: 'blur',
        message:
          'Use window.blur instead. https://github.com/facebook/create-react-app/blob/HEAD/packages/confusing-browser-globals/README.md'
      },
      {
        name: 'close',
        message:
          'Use window.close instead. https://github.com/facebook/create-react-app/blob/HEAD/packages/confusing-browser-globals/README.md'
      },
      {
        name: 'closed',
        message:
          'Use window.closed instead. https://github.com/facebook/create-react-app/blob/HEAD/packages/confusing-browser-globals/README.md'
      },
      {
        name: 'confirm',
        message:
          'Use window.confirm instead. https://github.com/facebook/create-react-app/blob/HEAD/packages/confusing-browser-globals/README.md'
      },
      {
        name: 'defaultStatus',
        message:
          'Use window.defaultStatus instead. https://github.com/facebook/create-react-app/blob/HEAD/packages/confusing-browser-globals/README.md'
      },
      {
        name: 'defaultstatus',
        message:
          'Use window.defaultstatus instead. https://github.com/facebook/create-react-app/blob/HEAD/packages/confusing-browser-globals/README.md'
      },
      {
        name: 'event',
        message:
          'Use window.event instead. https://github.com/facebook/create-react-app/blob/HEAD/packages/confusing-browser-globals/README.md'
      },
      {
        name: 'external',
        message:
          'Use window.external instead. https://github.com/facebook/create-react-app/blob/HEAD/packages/confusing-browser-globals/README.md'
      },
      {
        name: 'find',
        message:
          'Use window.find instead. https://github.com/facebook/create-react-app/blob/HEAD/packages/confusing-browser-globals/README.md'
      },
      {
        name: 'focus',
        message:
          'Use window.focus instead. https://github.com/facebook/create-react-app/blob/HEAD/packages/confusing-browser-globals/README.md'
      },
      {
        name: 'frameElement',
        message:
          'Use window.frameElement instead. https://github.com/facebook/create-react-app/blob/HEAD/packages/confusing-browser-globals/README.md'
      },
      {
        name: 'frames',
        message:
          'Use window.frames instead. https://github.com/facebook/create-react-app/blob/HEAD/packages/confusing-browser-globals/README.md'
      },
      {
        name: 'history',
        message:
          'Use window.history instead. https://github.com/facebook/create-react-app/blob/HEAD/packages/confusing-browser-globals/README.md'
      },
      {
        name: 'innerHeight',
        message:
          'Use window.innerHeight instead. https://github.com/facebook/create-react-app/blob/HEAD/packages/confusing-browser-globals/README.md'
      },
      {
        name: 'innerWidth',
        message:
          'Use window.innerWidth instead. https://github.com/facebook/create-react-app/blob/HEAD/packages/confusing-browser-globals/README.md'
      },
      {
        name: 'length',
        message:
          'Use window.length instead. https://github.com/facebook/create-react-app/blob/HEAD/packages/confusing-browser-globals/README.md'
      },
      {
        name: 'location',
        message:
          'Use window.location instead. https://github.com/facebook/create-react-app/blob/HEAD/packages/confusing-browser-globals/README.md'
      },
      {
        name: 'locationbar',
        message:
          'Use window.locationbar instead. https://github.com/facebook/create-react-app/blob/HEAD/packages/confusing-browser-globals/README.md'
      },
      {
        name: 'menubar',
        message:
          'Use window.menubar instead. https://github.com/facebook/create-react-app/blob/HEAD/packages/confusing-browser-globals/README.md'
      },
      {
        name: 'moveBy',
        message:
          'Use window.moveBy instead. https://github.com/facebook/create-react-app/blob/HEAD/packages/confusing-browser-globals/README.md'
      },
      {
        name: 'moveTo',
        message:
          'Use window.moveTo instead. https://github.com/facebook/create-react-app/blob/HEAD/packages/confusing-browser-globals/README.md'
      },
      {
        name: 'name',
        message:
          'Use window.name instead. https://github.com/facebook/create-react-app/blob/HEAD/packages/confusing-browser-globals/README.md'
      },
      {
        name: 'onblur',
        message:
          'Use window.onblur instead. https://github.com/facebook/create-react-app/blob/HEAD/packages/confusing-browser-globals/README.md'
      },
      {
        name: 'onerror',
        message:
          'Use window.onerror instead. https://github.com/facebook/create-react-app/blob/HEAD/packages/confusing-browser-globals/README.md'
      },
      {
        name: 'onfocus',
        message:
          'Use window.onfocus instead. https://github.com/facebook/create-react-app/blob/HEAD/packages/confusing-browser-globals/README.md'
      },
      {
        name: 'onload',
        message:
          'Use window.onload instead. https://github.com/facebook/create-react-app/blob/HEAD/packages/confusing-browser-globals/README.md'
      },
      {
        name: 'onresize',
        message:
          'Use window.onresize instead. https://github.com/facebook/create-react-app/blob/HEAD/packages/confusing-browser-globals/README.md'
      },
      {
        name: 'onunload',
        message:
          'Use window.onunload instead. https://github.com/facebook/create-react-app/blob/HEAD/packages/confusing-browser-globals/README.md'
      },
      {
        name: 'open',
        message:
          'Use window.open instead. https://github.com/facebook/create-react-app/blob/HEAD/packages/confusing-browser-globals/README.md'
      },
      {
        name: 'opener',
        message:
          'Use window.opener instead. https://github.com/facebook/create-react-app/blob/HEAD/packages/confusing-browser-globals/README.md'
      },
      {
        name: 'opera',
        message:
          'Use window.opera instead. https://github.com/facebook/create-react-app/blob/HEAD/packages/confusing-browser-globals/README.md'
      },
      {
        name: 'outerHeight',
        message:
          'Use window.outerHeight instead. https://github.com/facebook/create-react-app/blob/HEAD/packages/confusing-browser-globals/README.md'
      },
      {
        name: 'outerWidth',
        message:
          'Use window.outerWidth instead. https://github.com/facebook/create-react-app/blob/HEAD/packages/confusing-browser-globals/README.md'
      },
      {
        name: 'pageXOffset',
        message:
          'Use window.pageXOffset instead. https://github.com/facebook/create-react-app/blob/HEAD/packages/confusing-browser-globals/README.md'
      },
      {
        name: 'pageYOffset',
        message:
          'Use window.pageYOffset instead. https://github.com/facebook/create-react-app/blob/HEAD/packages/confusing-browser-globals/README.md'
      },
      {
        name: 'parent',
        message:
          'Use window.parent instead. https://github.com/facebook/create-react-app/blob/HEAD/packages/confusing-browser-globals/README.md'
      },
      {
        name: 'print',
        message:
          'Use window.print instead. https://github.com/facebook/create-react-app/blob/HEAD/packages/confusing-browser-globals/README.md'
      },
      {
        name: 'removeEventListener',
        message:
          'Use window.removeEventListener instead. https://github.com/facebook/create-react-app/blob/HEAD/packages/confusing-browser-globals/README.md'
      },
      {
        name: 'resizeBy',
        message:
          'Use window.resizeBy instead. https://github.com/facebook/create-react-app/blob/HEAD/packages/confusing-browser-globals/README.md'
      },
      {
        name: 'resizeTo',
        message:
          'Use window.resizeTo instead. https://github.com/facebook/create-react-app/blob/HEAD/packages/confusing-browser-globals/README.md'
      },
      {
        name: 'screen',
        message:
          'Use window.screen instead. https://github.com/facebook/create-react-app/blob/HEAD/packages/confusing-browser-globals/README.md'
      },
      {
        name: 'screenLeft',
        message:
          'Use window.screenLeft instead. https://github.com/facebook/create-react-app/blob/HEAD/packages/confusing-browser-globals/README.md'
      },
      {
        name: 'screenTop',
        message:
          'Use window.screenTop instead. https://github.com/facebook/create-react-app/blob/HEAD/packages/confusing-browser-globals/README.md'
      },
      {
        name: 'screenX',
        message:
          'Use window.screenX instead. https://github.com/facebook/create-react-app/blob/HEAD/packages/confusing-browser-globals/README.md'
      },
      {
        name: 'screenY',
        message:
          'Use window.screenY instead. https://github.com/facebook/create-react-app/blob/HEAD/packages/confusing-browser-globals/README.md'
      },
      {
        name: 'scroll',
        message:
          'Use window.scroll instead. https://github.com/facebook/create-react-app/blob/HEAD/packages/confusing-browser-globals/README.md'
      },
      {
        name: 'scrollbars',
        message:
          'Use window.scrollbars instead. https://github.com/facebook/create-react-app/blob/HEAD/packages/confusing-browser-globals/README.md'
      },
      {
        name: 'scrollBy',
        message:
          'Use window.scrollBy instead. https://github.com/facebook/create-react-app/blob/HEAD/packages/confusing-browser-globals/README.md'
      },
      {
        name: 'scrollTo',
        message:
          'Use window.scrollTo instead. https://github.com/facebook/create-react-app/blob/HEAD/packages/confusing-browser-globals/README.md'
      },
      {
        name: 'scrollX',
        message:
          'Use window.scrollX instead. https://github.com/facebook/create-react-app/blob/HEAD/packages/confusing-browser-globals/README.md'
      },
      {
        name: 'scrollY',
        message:
          'Use window.scrollY instead. https://github.com/facebook/create-react-app/blob/HEAD/packages/confusing-browser-globals/README.md'
      },
      {
        name: 'self',
        message:
          'Use window.self instead. https://github.com/facebook/create-react-app/blob/HEAD/packages/confusing-browser-globals/README.md'
      },
      {
        name: 'status',
        message:
          'Use window.status instead. https://github.com/facebook/create-react-app/blob/HEAD/packages/confusing-browser-globals/README.md'
      },
      {
        name: 'statusbar',
        message:
          'Use window.statusbar instead. https://github.com/facebook/create-react-app/blob/HEAD/packages/confusing-browser-globals/README.md'
      },
      {
        name: 'stop',
        message:
          'Use window.stop instead. https://github.com/facebook/create-react-app/blob/HEAD/packages/confusing-browser-globals/README.md'
      },
      {
        name: 'toolbar',
        message:
          'Use window.toolbar instead. https://github.com/facebook/create-react-app/blob/HEAD/packages/confusing-browser-globals/README.md'
      },
      {
        name: 'top',
        message:
          'Use window.top instead. https://github.com/facebook/create-react-app/blob/HEAD/packages/confusing-browser-globals/README.md'
      }
    ],
    'no-restricted-properties': [
      'error',
      {
        object: 'arguments',
        property: 'callee',
        message: 'arguments.callee is deprecated'
      },
      {
        object: 'global',
        property: 'isFinite',
        message: 'Please use Number.isFinite instead'
      },
      {
        object: 'self',
        property: 'isFinite',
        message: 'Please use Number.isFinite instead'
      },
      {
        object: 'window',
        property: 'isFinite',
        message: 'Please use Number.isFinite instead'
      },
      {
        object: 'global',
        property: 'isNaN',
        message: 'Please use Number.isNaN instead'
      },
      {
        object: 'self',
        property: 'isNaN',
        message: 'Please use Number.isNaN instead'
      },
      {
        object: 'window',
        property: 'isNaN',
        message: 'Please use Number.isNaN instead'
      },
      {
        property: '__defineGetter__',
        message: 'Please use Object.defineProperty instead.'
      },
      {
        property: '__defineSetter__',
        message: 'Please use Object.defineProperty instead.'
      },
      {
        object: 'Math',
        property: 'pow',
        message: 'Use the exponentiation operator (**) instead.'
      }
    ],
    'no-return-assign': ['error', 'always'],
    'no-script-url': 'error',
    'no-self-assign': [
      'error',
      {
        props: true
      }
    ],
    'no-self-compare': 'error',
    'no-sequences': 'error',
    'no-setter-return': 'error',
    'no-shadow-restricted-names': 'error',
    'no-sparse-arrays': 'error',
    'no-template-curly-in-string': 'error',
    'no-this-before-super': 'error',
    'no-throw-literal': 'error',
    'no-underscore-dangle': [
      'error',
      {
        allow: ['__REDUX_DEVTOOLS_EXTENSION_COMPOSE__'],
        allowAfterThis: false,
        allowAfterSuper: false,
        enforceInMethodNames: true
      }
    ],
    'no-unexpected-multiline': 'error',
    'no-unneeded-ternary': [
      'error',
      {
        defaultAssignment: false
      }
    ],
    'no-unreachable': 'error',
    'no-unsafe-finally': 'error',
    'no-unsafe-negation': 'error',
    'no-unsafe-optional-chaining': [
      'error',
      {
        disallowArithmeticOperators: true
      }
    ],
    'no-unused-expressions': 'off',
    'no-unused-labels': 'error',
    'no-unused-private-class-members': 'off',
    'no-unused-vars': [
      'error',
      {
        caughtErrors: 'none'
      }
    ],
    'no-use-before-define': [
      'error',
      {
        functions: true,
        classes: true,
        variables: true
      }
    ],
    'no-useless-backreference': 'error',
    'no-useless-catch': 'error',
    'no-useless-computed-key': 'error',
    'no-useless-concat': 'error',
    'no-useless-constructor': 'error',
    'no-useless-escape': 'error',
    'no-useless-rename': [
      'error',
      {
        ignoreDestructuring: false,
        ignoreImport: false,
        ignoreExport: false
      }
    ],
    'no-useless-return': 'error',
    'no-var': 'error',
    'no-void': 'error',
    'no-with': 'error',
    'object-shorthand': [
      'error',
      'always',
      {
        ignoreConstructors: false,
        avoidQuotes: true
      }
    ],
    'one-var': ['error', 'never'],
    'operator-assignment': ['error', 'always'],
    'prefer-arrow-callback': [
      'error',
      {
        allowNamedFunctions: false,
        allowUnboundThis: true
      }
    ],
    'prefer-const': [
      'error',
      {
        destructuring: 'any',
        ignoreReadBeforeAssign: true
      }
    ],
    'prefer-destructuring': [
      'error',
      {
        VariableDeclarator: {
          array: false,
          object: true
        },
        AssignmentExpression: {
          array: true,
          object: false
        }
      },
      {
        enforceForRenamedProperties: false
      }
    ],
    'prefer-exponentiation-operator': 'error',
    'prefer-numeric-literals': 'error',
    'prefer-object-has-own': 'error',
    'prefer-object-spread': 'error',
    'prefer-promise-reject-errors': [
      'error',
      {
        allowEmptyReject: true
      }
    ],
    'prefer-regex-literals': [
      'error',
      {
        disallowRedundantWrapping: true
      }
    ],
    'prefer-rest-params': 'error',
    'prefer-spread': 'error',
    'prefer-template': 'error',
    radix: 'error',
    'react/button-has-type': 'error',
    'react/error-boundaries': 'error',
    'react/exhaustive-deps': 'off',
    'react/forward-ref-uses-ref': 'error',
    'react/globals': 'error',
    'react/immutability': 'error',
    'react/incompatible-library': 'warn',
    'react/jsx-boolean-value': [
      'error',
      'never',
      {
        always: []
      }
    ],
    'react/jsx-curly-brace-presence': [
      'error',
      {
        props: 'never',
        children: 'never'
      }
    ],
    'react/jsx-filename-extension': [
      'error',
      {
        extensions: ['.jsx']
      }
    ],
    'react/jsx-fragments': ['error', 'syntax'],
    'react/jsx-key': 'off',
    'react/jsx-no-comment-textnodes': 'error',
    'react/jsx-no-duplicate-props': 'error',
    'react/jsx-no-script-url': [
      'error',
      [
        {
          name: 'Link',
          props: ['to', 'href']
        },
        {
          name: 'NavLink',
          props: ['to']
        },
        {
          name: 'NextLink',
          props: ['to', 'href']
        }
      ],
      {
        includeFromSettings: true
      }
    ],
    'react/jsx-no-target-blank': [
      'error',
      {
        allowReferrer: false,
        enforceDynamicLinks: 'always',
        warnOnSpreadAttributes: false,
        links: true,
        forms: false
      }
    ],
    'react/jsx-no-undef': 'error',
    'react/jsx-no-useless-fragment': [
      'error',
      {
        allowExpressions: true
      }
    ],
    'react/jsx-pascal-case': [
      'error',
      {
        allowAllCaps: true,
        allowLeadingUnderscore: false,
        allowNamespace: true,
        ignore: []
      }
    ],
    'react/jsx-props-no-spread-multi': 'error',
    'react/no-children-prop': 'error',
    'react/no-danger-with-children': 'error',
    'react/no-did-mount-set-state': 'off',
    'react/no-did-update-set-state': 'error',
    'react/no-direct-mutation-state': 'error',
    'react/no-find-dom-node': 'error',
    'react/no-is-mounted': 'error',
    'react/no-namespace': 'error',
    'react/no-redundant-should-component-update': 'error',
    'react/no-render-return-value': 'error',
    'react/no-string-refs': [
      'error',
      {
        noTemplateLiterals: true
      }
    ],
    'react/no-this-in-sfc': 'error',
    'react/no-unescaped-entities': 'error',
    'react/no-unknown-property': [
      'error',
      {
        ignore: [],
        requireDataLowercase: false
      }
    ],
    'react/no-unsafe': 'off',
    'react/no-unstable-nested-components': 'error',
    'react/no-will-update-set-state': 'error',
    'react/prefer-es6-class': ['error', 'always'],
    'react/preserve-manual-memoization': 'error',
    'react/purity': 'error',
    'react/react-in-jsx-scope': 'error',
    'react/refs': 'error',
    'react/rules-of-hooks': 'error',
    'react/set-state-in-effect': 'off',
    'react/set-state-in-render': 'error',
    'react/state-in-constructor': ['error', 'always'],
    'react/static-components': 'error',
    'react/style-prop-object': [
      'error',
      {
        allow: []
      }
    ],
    'react/unsupported-syntax': 'warn',
    'react/use-memo': 'error',
    'react/void-dom-elements-no-children': 'error',
    'require-yield': 'error',
    'symbol-description': 'error',
    'typescript/consistent-return': 'error',
    'typescript/dot-notation': [
      'error',
      {
        allowKeywords: true
      }
    ],
    'unicode-bom': ['error', 'never'],
    'use-isnan': 'error',
    'valid-typeof': [
      'error',
      {
        requireStringLiterals: true
      }
    ],
    'vars-on-top': 'error',
    yoda: 'error'
  },
  overrides: [
    {
      files: ['**/*.{ts,tsx,mts,cts}'],
      rules: {
        'class-methods-use-this': 'off',
        'constructor-super': 'off',
        'getter-return': 'off',
        'import/no-named-as-default-member': 'off',
        'no-class-assign': 'off',
        'no-const-assign': 'off',
        'no-dupe-class-members': 'off',
        'no-dupe-keys': 'off',
        'no-func-assign': 'off',
        'no-implied-eval': 'off',
        'no-import-assign': 'off',
        'no-new-func': 'off',
        'no-obj-calls': 'off',
        'no-redeclare': 'off',
        'no-setter-return': 'off',
        'no-this-before-super': 'off',
        'no-throw-literal': 'off',
        'no-unreachable': 'off',
        'no-unsafe-negation': 'off',
        'no-with': 'off',
        'prefer-destructuring': 'off',
        'react/jsx-filename-extension': [
          'error',
          {
            extensions: ['.jsx', '.tsx']
          }
        ],
        'typescript/array-type': [
          'error',
          {
            default: 'array',
            readonly: 'array'
          }
        ],
        'typescript/await-thenable': 'off',
        'typescript/ban-tslint-comment': 'error',
        'typescript/class-literal-property-style': ['error', 'fields'],
        'typescript/consistent-indexed-object-style': 'error',
        'typescript/consistent-return': 'off',
        'typescript/consistent-type-definitions': ['error', 'interface'],
        'typescript/dot-notation': [
          'error',
          {
            allowKeywords: true,
            allowPrivateClassPropertyAccess: false,
            allowProtectedClassPropertyAccess: false,
            allowIndexSignaturePropertyAccess: false
          }
        ],
        'typescript/no-array-delete': 'off',
        'typescript/no-base-to-string': 'off',
        'typescript/no-confusing-non-null-assertion': 'error',
        'typescript/no-duplicate-type-constituents': 'off',
        'typescript/no-floating-promises': 'off',
        'typescript/no-inferrable-types': [
          'error',
          {
            ignoreParameters: false,
            ignoreProperties: false
          }
        ],
        'typescript/no-meaningless-void-operator': 'off',
        'typescript/no-misused-spread': 'off',
        'typescript/no-mixed-enums': 'error',
        'typescript/no-namespace': [
          'error',
          {
            allowDeclarations: false,
            allowDefinitionFiles: true
          }
        ],
        'typescript/no-non-null-asserted-optional-chain': 'off',
        'typescript/no-redundant-type-constituents': 'off',
        'typescript/no-require-imports': [
          'error',
          {
            allow: [],
            allowAsImport: false
          }
        ],
        'typescript/no-this-alias': [
          'error',
          {
            allowDestructuring: true,
            allowedNames: ['self', 'that']
          }
        ],
        'typescript/no-unnecessary-qualifier': 'error',
        'typescript/no-unnecessary-template-expression': 'error',
        'typescript/no-unnecessary-type-arguments': 'error',
        'typescript/no-unnecessary-type-constraint': 'error',
        'typescript/no-unsafe-function-type': 'error',
        'typescript/no-useless-default-assignment': 'off',
        'typescript/no-useless-empty-export': 'off',
        'typescript/only-throw-error': 'error',
        'typescript/prefer-find': 'error',
        'typescript/prefer-function-type': 'error',
        'typescript/require-array-sort-compare': 'off',
        'typescript/restrict-template-expressions': 'off',
        'typescript/return-await': ['error', 'in-try-catch'],
        'typescript/triple-slash-reference': [
          'error',
          {
            lib: 'always',
            path: 'never',
            types: 'prefer-import'
          }
        ],
        'typescript/unbound-method': 'off',
        'valid-typeof': 'off'
      }
    },
    {
      files: ['**/*.{js,jsx,mjs,cjs}'],
      rules: {
        'typescript/await-thenable': 'off',
        'typescript/consistent-return': 'off',
        'typescript/dot-notation': 'off',
        'typescript/no-array-delete': 'off',
        'typescript/no-base-to-string': 'off',
        'typescript/no-duplicate-type-constituents': 'off',
        'typescript/no-floating-promises': 'off',
        'typescript/no-for-in-array': 'off',
        'typescript/no-implied-eval': 'off',
        'typescript/no-meaningless-void-operator': 'off',
        'typescript/no-misused-spread': 'off',
        'typescript/no-redundant-type-constituents': 'off',
        'typescript/no-unsafe-unary-minus': 'off',
        'typescript/no-useless-default-assignment': 'off',
        'typescript/require-array-sort-compare': 'off',
        'typescript/restrict-template-expressions': 'off',
        'typescript/unbound-method': 'off'
      }
    },
    {
      files: ['*.js', 'packages/extension/*.js'],
      rules: {
        'no-template-curly-in-string': 'off'
      },
      globals: {
        module: 'writable',
        require: 'readonly',
        process: 'readonly',
        __dirname: 'readonly'
      }
    },
    {
      files: ['packages/site/**/*.{ts,tsx}'],
      rules: {
        'react/react-in-jsx-scope': 'off'
      }
    }
  ]
});
