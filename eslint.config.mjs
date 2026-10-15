import { defineConfig, globalIgnores } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginVue from 'eslint-plugin-vue';

export default defineConfig([
  globalIgnores(['dist/**', 'coverage/**', 'node_modules/**']),
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // TypeScript already reports undefined identifiers; no-undef only adds false positives (DOM types).
  { files: ['**/*.ts', '**/*.vue'], rules: { 'no-undef': 'off' } },
  { files: ['scripts/**'], languageOptions: { globals: { process: 'readonly' } } },
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: { parserOptions: { parser: tseslint.parser } },
  },
  {
    // Prettier owns formatting; keep eslint-plugin-vue's stylistic rules out of its way.
    files: ['**/*.vue'],
    rules: {
      'vue/html-self-closing': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/max-attributes-per-line': 'off',
      'vue/html-indent': 'off',
      'vue/html-closing-bracket-newline': 'off',
      'vue/multiline-html-element-content-newline': 'off',
    },
  },
]);
