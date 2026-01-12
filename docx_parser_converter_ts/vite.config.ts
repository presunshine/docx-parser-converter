// vite.config.ts
import { defineConfig } from 'vite';
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
      formats: ['es', 'cjs'],
      fileName: (format) => `docx-parser-converter.${format === 'es' ? 'es.js' : 'cjs'}`,
    },
    rollupOptions: {
      output: {
        exports: 'named',
      }
    },
  },
});