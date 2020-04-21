import nodeResolve from 'rollup-plugin-node-resolve';

export default {
  input: 'dist/esm/index.js',
  output: {
    file: 'dist/index.js',
    format: 'iife',
    name: 'demo',
    sourcemap: true
  },
  plugins: [
    nodeResolve()
  ]
};