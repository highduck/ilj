import nodeResolve from 'rollup-plugin-node-resolve';
import {terser} from 'rollup-plugin-terser';

export default {
  input: 'dist/esm/index.js',
  output: {
    file: 'dist/index.js',
    format: 'iife',
    name: 'binpack',
    sourcemap: true,
    compact: true,
    plugins: [terser()]
  },
  plugins: [
    nodeResolve()
  ]
};