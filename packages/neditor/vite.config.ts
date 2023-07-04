import { defineConfig } from 'vite';
// @ts-ignore
import { resolve } from 'path';
import checker from 'vite-plugin-checker';
import { viteCommonjs } from '@originjs/vite-plugin-commonjs';
// yarn add --dev @esbuild-plugins/node-globals-polyfill
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
// yarn add --dev @esbuild-plugins/node-modules-polyfill
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill';
// You don't need to add this to deps, it's included by @esbuild-plugins/node-modules-polyfill
import rollupNodePolyFill from 'rollup-plugin-node-polyfills';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  base: './',
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      // This Rollup aliases are extracted from @esbuild-plugins/node-modules-polyfill,
      // see https://github.com/remorses/esbuild-plugins/blob/master/node-modules-polyfill/src/polyfills.ts
      // process and buffer are excluded because already managed
      // by node-globals-polyfill
      util: 'rollup-plugin-node-polyfills/polyfills/util',
      assert: 'rollup-plugin-node-polyfills/polyfills/assert',
      buffer: 'rollup-plugin-node-polyfills/polyfills/buffer-es6',
    },
    extensions: ['.js', '.ts', '.json', '.tsx', '.vue']
  },
  optimizeDeps: {
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: 'globalThis'
      },
      // Enable esbuild polyfill plugins
      plugins: [
        // @ts-ignore
        NodeGlobalsPolyfillPlugin({ process: true }),
        // @ts-ignore
        NodeModulesPolyfillPlugin()
      ]
    }
  },
  build: {
    commonjsOptions: { include: [/icu/, /skia/, /node_modules/] },
    rollupOptions: {
      plugins: [
        // Enable rollup polyfills plugin
        // used during production bundling
        //@ts-ignore
        rollupNodePolyFill()
      ]
    }
  },
  plugins: [
    // @ts-ignore
    viteCommonjs(),
    vue(),
    // @ts-ignore
    checker({ typescript: true })
  ]
});
