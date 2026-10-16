import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';

// In dev, /api is forwarded to the backend by Vite itself. In production the
// same contract is served by api/proxy.ts (a Vercel Function), so the
// browser only ever talks to its own origin in both cases - no CORS needed.
const backendUrl = process.env.BACKEND_API_URL ?? 'http://localhost:8080';

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    proxy: {
      '/api': { target: backendUrl, changeOrigin: true, rewrite: (path) => path.slice(4) },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      // Fails `npm run test:coverage` (and so the CI test job) when a total drops below the
      // floor. Measured at 97/95/95/97, so a few points of headroom, not a target to coast on.
      thresholds: { statements: 90, branches: 85, functions: 90, lines: 90 },
      exclude: [
        'node_modules/',
        'e2e/',
        'playwright.config.ts',
        'src/setupTests.ts',
        'src/testUtils.ts',
        'vite.config.ts',
        'eslint.config.mjs',
      ],
    },
    exclude: ['node_modules/**', 'dist/**', 'e2e/**'],
  },
});
