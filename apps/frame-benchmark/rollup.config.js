import resolve from '@rollup/plugin-node-resolve';
import { babel } from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import sourcemaps from 'rollup-plugin-sourcemaps';
import visualizer from 'rollup-plugin-visualizer';
import replace from '@rollup/plugin-replace';

const debug = false;
const DEBUG_BABEL = false;

export default {
  input: 'dist/index.js',
  output: {
    file: 'bundle/index.js',
    name: 'tests',
    format: 'iife',
    sourcemap: true,
    compact: true,
    strict: true,
  },
  plugins: [
    sourcemaps(),
    resolve({
      preferBuiltins: true,
    }),
    commonjs(),
    replace({
      values: {
        _DEBUG: JSON.stringify(debug),
        'process.env.DEBUG': JSON.stringify(debug),
      },
    }),
    babel({
      sourceMaps: true,
      inputSourceMap: false,
      babelHelpers: 'bundled',
      babelrc: false,
      exclude: [/\/core-js\//],
      presets: [
        [
          '@babel/preset-env',
          {
            targets: '> 0.25%, not dead',
            useBuiltIns: 'usage',
            corejs: 3,
            modules: false,
            //spec: true,
            forceAllTransforms: false,
            debug: DEBUG_BABEL,
          },
        ],
      ],
      plugins: [],
    }),
    terser({
      ecma: 5,
      compress: {
        passes: 2,
        hoist_funs: true,
        reduce_funcs: false,
        reduce_vars: false,
        keep_infinity: true,
        negate_iife: false,
        toplevel: true,
      },
      mangle: {
        toplevel: true,
      },
      toplevel: true,
      safari10: true,
      output: {
        // format in terser 5
        beautify: false,
        // beautify: true
      },
    }),
    visualizer({
      filename: `dist/stats.html`,
      sourcemap: true,
    }),
  ],
};
