import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * Shared flat config. Each workspace calls this from its own eslint.config.mjs
 * so type-aware rules resolve against that workspace's tsconfig.
 *
 * @param {{ tsconfigRootDir: string, browser?: boolean }} options
 */
export function createConfig({ tsconfigRootDir, browser = false }) {
  return tseslint.config(
    {
      ignores: [
        '**/dist/**',
        '**/.next/**',
        '**/.expo/**',
        '**/.turbo/**',
        '**/coverage/**',
        '**/*.config.*',
        '**/next-env.d.ts',
        '**/expo-env.d.ts',
      ],
    },
    js.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    {
      languageOptions: {
        globals: browser ? { ...globals.browser } : { ...globals.node },
        parserOptions: { projectService: true, tsconfigRootDir },
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/no-non-null-assertion': 'error',
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        'no-console': 'error',
      },
    },
    {
      files: ['**/*.test.ts', '**/*.test.tsx'],
      rules: { '@typescript-eslint/no-non-null-assertion': 'off' },
    },
  );
}
