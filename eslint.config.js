import js from '@eslint/js';
import prettier from 'eslint-config-prettier';

const sharedGlobals = {
  process: 'readonly',
  console: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  setInterval: 'readonly',
  clearInterval: 'readonly',
  Buffer: 'readonly',
  URL: 'readonly',
};

const sharedRules = {
  'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  'no-console': 'off',
  'no-empty': ['error', { allowEmptyCatch: true }],
};

export default [
  js.configs.recommended,
  prettier,
  {
    files: ['src/**/*.js', 'hooks/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: sharedGlobals,
    },
    rules: sharedRules,
  },
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
];
