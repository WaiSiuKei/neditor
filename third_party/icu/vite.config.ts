import { defineConfig } from 'vite';
import { resolve } from 'path';
import checker from 'vite-plugin-checker';
import { viteCommonjs } from '@originjs/vite-plugin-commonjs'
import topLevelAwait from "vite-plugin-top-level-await";

export default defineConfig({
  base: './',
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    },
    extensions: ['.js', '.ts', '.tsx', '.json', '.wasm']
  },
  plugins: [
    // @ts-ignore
    viteCommonjs(),
    checker({ typescript: true }),
    topLevelAwait()
  ],
});
