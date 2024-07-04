import nodeResolve from '@rollup/plugin-node-resolve';


import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import wasm from '@rollup/plugin-wasm';
import json from '@rollup/plugin-json'

export default {
  input: 'src/index.ts', // Adjust the path to your entry file
  output: [{
    file: 'dist/bundle.cjs.cjs',
    sourcemap: true,
    format: 'cjs', // Use 'esm' for ES module
    inlineDynamicImports: true,
  }],
  plugins: [
    nodeResolve({ preferBuiltins: false }),
    commonjs(),
    typescript(),
    wasm(),
    json(),
  ],
  external: ["ethers", "zkwasm-service-helper"]
};
