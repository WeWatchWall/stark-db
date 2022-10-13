module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',

  plugins: [
    '@typescript-eslint',
  ],

  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],

  env: {
    node: true
  },

  'extends': [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended'
  ],

  parserOptions: {
    ecmaVersion: 2020
  },
  "ignorePatterns": [
    "dist/*",
    "*.test.js",
    ".eslintrc.js",
    "execShellCommand.js",
    "postinstall.js",
    "publish.js"
  ],
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    '@typescript-eslint/no-this-alias': [
      "error",
      {
        "allowDestructuring": false, // Disallow `const { props, state } = this`; true by default
        "allowedNames": ["self"] // Allow `const self = this`; `[]` by default
      }
    ],
    '@typescript-eslint/no-var-requires': 0
  }
};
