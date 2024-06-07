import nodeResolve from '@rollup/plugin-node-resolve';
// import nodePolyfills from 'rollup-plugin-node-polyfills';

import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import wasm from '@rollup/plugin-wasm';
import json from '@rollup/plugin-json'

export default {
  input: 'src/index.ts', // Adjust the path to your entry file
  output: [{
    file: 'dist/bundle.mjs.js',
    format: 'esm', // Use 'esm' for ES module
  }],
  plugins: [
    commonjs(),
    typescript(),
    wasm(),
    json(),
  ],
};
