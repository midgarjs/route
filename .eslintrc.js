module.exports = {
  env: {
    es6: true,
    node: true,
    mocha: true
  },
  ignorePatterns: ['docs/**/*'],
  extends: ['prettier'],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly'
  },
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module'
  },
  rules: {
    'prettier/prettier': 'error'
  },
  parser: 'babel-eslint',
  plugins: ['sonarjs']
}
