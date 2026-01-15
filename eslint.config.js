import js from '@eslint/js';
import ts from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2021,
      sourceType: 'module',
        globals: {
        document: 'readonly',
        window: 'readonly',
        localStorage: 'readonly',
        performance: 'readonly',
        requestAnimationFrame: 'readonly',
        HTMLCanvasElement: 'readonly',
        CanvasRenderingContext2D: 'readonly',
        HTMLElement: 'readonly',
        HTMLButtonElement: 'readonly',
        KeyboardEvent: 'readonly',
        MouseEvent: 'readonly',
        TouchEvent: 'readonly',
        CanvasGradient: 'readonly',
        MutationObserver: 'readonly',
        fetch: 'readonly',
        EventTarget: 'readonly',
        EventListener: 'readonly',
        Event: 'readonly',
        AddEventListenerOptions: 'readonly',
        EventListenerOptions: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': ts,
    },
    rules: {
      ...ts.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'prefer-const': 'error',
      'no-var': 'error',
      'semi': ['error', 'always'],
      'comma-dangle': ['error', 'never']
    }
  },
  {
    ignores: ['node_modules/', 'dist/', 'build/', 'public/', 'src/dist/']
  }
];