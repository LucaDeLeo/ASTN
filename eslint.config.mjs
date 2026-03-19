import { defineConfig, globalIgnores } from 'eslint/config'
import convexPlugin from '@convex-dev/eslint-plugin'
import tseslint from 'typescript-eslint'

export default defineConfig([
  tseslint.configs.base,
  ...convexPlugin.configs.recommended,
  globalIgnores(['convex/_generated']),
])
