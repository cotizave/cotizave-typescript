import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
  target: 'node22',
  // Ky is ESM-only. Inlining it keeps the CommonJS build working and means
  // consumers install nothing besides this package. Its license ships in
  // THIRD_PARTY_NOTICES.md.
  noExternal: ['ky'],
  outExtension({ format }) {
    return { js: format === 'cjs' ? '.cjs' : '.js' };
  },
});
