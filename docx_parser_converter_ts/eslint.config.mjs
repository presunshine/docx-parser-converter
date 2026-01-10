import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  // Global ignores
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '**/*.js',
      '**/*.mjs',
      '**/__tests__/**',
      '**/*.test.ts',
      'src/docx_parsers/**',
      'src/docx_to_html/**',
      'src/docx_to_txt/**',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  // Override rules
  {
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': 'warn',
    },
  },
];
