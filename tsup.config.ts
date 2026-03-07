import { defineConfig } from 'tsup';
import { copyFileSync, mkdirSync } from 'fs';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  external: ['react', 'react-dom', 'zod', '@verevoir/schema'],
  onSuccess: async () => {
    mkdirSync('dist/styles', { recursive: true });
    copyFileSync(
      'src/styles/preview-frame.css',
      'dist/styles/preview-frame.css',
    );
    copyFileSync('src/styles/editor-form.css', 'dist/styles/editor-form.css');
    copyFileSync('src/styles/rich-text.css', 'dist/styles/rich-text.css');
  },
});
