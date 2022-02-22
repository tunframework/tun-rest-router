// @ts-check

// 参考 https://github.com/vitejs/vite/blob/main/.eslintrc.cjs

const { defineConfig } = require('eslint-define-config')

module.exports = defineConfig({
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:node/recommended',
    'plugin:@typescript-eslint/recommended'
    // 'plugin:import/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2021
  },
  rules: {
    // eqeqeq: ['warn', 'always', { null: 'never' }],
    'no-debugger': ['error'],
    'no-empty': ['warn', { allowEmptyCatch: true }],
    'no-process-exit': 'off',
    'no-useless-escape': 'off',
    // 'prefer-const': [
    //   'warn',
    //   {
    //     destructuring: 'all'
    //   }
    // ],
    'prefer-const': ['off'],

    // 'node/no-missing-import': [
    //   'error',
    //   {
    //     allowModules: [
    //       'types',
    //       'estree',
    //       'testUtils',
    //       'less',
    //       'sass',
    //       'stylus'
    //     ],
    //     tryExtensions: ['.ts', '.js', '.jsx', '.tsx', '.d.ts']
    //   }
    // ],
    'node/no-missing-require': [
      'error',
      {
        // for try-catching yarn pnp
        // allowModules: ['pnpapi', 'vite'],
        tryExtensions: ['.ts', '.js', '.jsx', '.tsx', '.d.ts']
      }
    ],
    'node/no-restricted-require': [
      'error',
      Object.keys(require('./package.json').devDependencies).map((d) => ({
        name: d,
        message:
          `devDependencies can only be imported using ESM syntax so ` +
          `that they are included in the rollup bundle. If you are trying to ` +
          `lazy load a dependency, use (await import('dependency')).default instead.`
      }))
    ],
    // 'node/no-extraneous-import': [
    //   'error',
    //   {
    //     // allowModules: ['vite', 'less', 'sass']
    //   }
    // ],
    'node/no-extraneous-require': [
      'error',
      {
        // allowModules: ['vite']
      }
    ],
    'node/no-deprecated-api': 'off',
    'node/no-unpublished-import': 'off',
    'node/no-unpublished-require': 'off',
    // 'node/no-unsupported-features/es-syntax': 'off',

    '@typescript-eslint/ban-ts-comment': 'off', // TODO: we should turn this on in a new PR
    '@typescript-eslint/ban-types': 'off', // TODO: we should turn this on in a new PR
    '@typescript-eslint/no-empty-function': [
      'error',
      { allow: ['arrowFunctions'] }
    ],
    '@typescript-eslint/no-empty-interface': 'off',
    '@typescript-eslint/no-explicit-any': 'off', // maybe we should turn this on in a new PR
    '@typescript-eslint/no-extra-semi': 'off', // conflicts with prettier
    '@typescript-eslint/no-inferrable-types': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off', // maybe we should turn this on in a new PR
    '@typescript-eslint/no-unused-vars': 'off', // maybe we should turn this on in a new PR
    '@typescript-eslint/no-var-requires': 'off',
    // '@typescript-eslint/consistent-type-imports': [
    //   'error',
    //   { prefer: 'type-imports' }
    // ],
    // https://qastack.cn/programming/59265981/typescript-eslint-missing-file-extension-ts-import-extensions
    // https://stackoverflow.com/questions/68878189/eslint-definition-for-rule-import-extensions-was-not-found
    // "import/extensions": [
    //   "error",
    //   "ignorePackages",
    //   {
    //     "js": "never",
    //     "jsx": "never",
    //     "ts": "never",
    //     "tsx": "never",
    //   },
    // ],
    // https://stackoverflow.com/questions/61024198/eslint-conflicts-with-eslint-plugin-import-and-typescript-eslint
    'node/no-unsupported-features/es-syntax': [
      'error',
      { ignores: ['modules', 'dynamicImport'] }
    ],
    'node/no-extraneous-import': [
      'error',
      {
        allowModules: ['express']
      }
    ],
    'node/no-missing-import': ['off'],
    'import/no-unresolved': ['off'],
    'no-irregular-whitespace': ['off']
  },
  overrides: [
    // {
    //   files: ['packages/vite/src/node/**'],
    //   rules: {
    //     'no-console': ['error']
    //   }
    // },
    // {
    //   files: ['packages/vite/types/**'],
    //   rules: {
    //     'node/no-extraneous-import': 'off'
    //   }
    // },
    // {
    //   files: ['packages/playground/**'],
    //   rules: {
    //     'node/no-extraneous-import': 'off',
    //     'node/no-extraneous-require': 'off'
    //   }
    // },
    // {
    //   files: ['packages/create-vite/template-*/**'],
    //   rules: {
    //     'node/no-missing-import': 'off'
    //   }
    // },
    {
      files: ['*.js'],
      rules: {
        '@typescript-eslint/explicit-module-boundary-types': 'off'
      }
    },
    {
      files: ['*.d.ts'],
      rules: {
        '@typescript-eslint/triple-slash-reference': 'off'
      }
    }
  ],
  // https://stackoverflow.com/questions/61024198/eslint-conflicts-with-eslint-plugin-import-and-typescript-eslint
  settings: {
    resolvePaths: ['node_modules/@types'],
    node: {
      tryExtensions: ['.js', '.json', '.node', '.ts', '.d.ts'],
      resolvePaths: ['node_modules/@types']
    },
    'import/resolver': { node: { extensions: ['.js', '.jsx', '.ts', '.tsx'] } },
    'import/extensions': ['.js', '.jsx', '.ts', '.tsx'],
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx']
    },
    'import/internal-regex': '.js$/'
  }
})
