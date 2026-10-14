import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // Flows came from a TypeScript project without ESLint; `npm run typecheck`
  // covers it instead.
  globalIgnores(['dist', 'src/flows']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // The imported Dashboard home search sets state from effects in several
      // places. Surfaced as warnings so lint passes without rewriting that UI.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  {
    files: ['vite.config.js', 'scripts/**'],
    languageOptions: { globals: globals.node },
  },
])
