// vite.config.ts
import { defineConfig } from 'vite';
import path from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      outDir: 'dist/types',
    }),
  ],
  build: {
    sourcemap: true,
    lib: {
      entry: 'src/index.ts', // Main entry point
      name: 'DocxParserConverter',
      formats: ['es', 'umd', 'iife'],
      fileName: (format) => `docx-parser-converter.${format}.js`,
    },
    rollupOptions: {
            output: {
        exports: 'named',
      }
    },
  },
});