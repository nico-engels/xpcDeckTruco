import js from "@eslint/js";
import { defineConfig } from 'eslint/config';
import stylistic from '@stylistic/eslint-plugin'
import tseslint from 'typescript-eslint';

export default defineConfig(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      '@stylistic': stylistic
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@stylistic/max-len': ['error', { 'code': 120, 'tabWidth': 2 }],
    },
  }
);