import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';

import typescript from '@rollup/plugin-typescript';
import wasm from '@rollup/plugin-wasm';
import json from '@rollup/plugin-json'
export default {
  input: 'src/index.ts', // Adjust the path to your entry file
  output: [{
    file: 'dist/bundle.mjs.js',
    sourcemap: true,
    format: 'esm', // Use 'esm' for ES module
    inlineDynamicImports: true,
  }],
  plugins: [
    commonjs(),
    typescript(),
    wasm(),
    json(),
    nodeResolve({ preferBuiltins: false }),
  ],
  external: ["ethers", "zkwasm-service-helper"]
};
