import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

/**
 * Two build modes:
 *   npm run build         -> dist/        normal build, what GitHub Pages serves
 *   npm run build:single  -> dist-single/ one self-contained index.html to email around
 *
 * `base: './'` keeps every asset path relative, so the same dist/ works at
 * https://<user>.github.io/<repo>/, at a custom domain, or opened from disk.
 */
export default defineConfig(({ mode }) => {
  const single = mode === 'single';

  return {
    base: './',
    plugins: [react(), ...(single ? [viteSingleFile()] : [])],
    build: {
      outDir: single ? 'dist-single' : 'dist',
      emptyOutDir: true,
      target: 'es2020',
    },
    test: {
      environment: 'node',
      include: ['src/**/*.test.js'],
    },
  };
});
