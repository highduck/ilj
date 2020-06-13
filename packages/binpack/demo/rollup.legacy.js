import nodeResolve from '@rollup/plugin-node-resolve';
import {terser} from 'rollup-plugin-terser';
import {babel} from '@rollup/plugin-babel';
import analyze from 'rollup-plugin-analyzer';
import typescript from 'rollup-plugin-typescript2';
import { DEFAULT_EXTENSIONS } from '@babel/core';

export default {
    input: 'dist/esm/index.js',
    output: [
        {
            file: 'dist/index.js',
            format: 'iife',
            name: 'binpack',
            sourcemap: true,
        },
        {
            file: 'dist/index.min.js',
            format: 'iife',
            name: 'binpack',
            sourcemap: true,
            plugins: [terser()]
        }
    ],
    plugins: [
        analyze(),
        nodeResolve(),
        typescript({tsconfig:'tsconfig.json'}),
        babel({
            babelHelpers: 'bundled',
            babelrc: false,
            extensions: [...DEFAULT_EXTENSIONS, 'ts'],
            exclude: 'node_modules/**',
            presets: [[
                "@babel/preset-env", {targets: "> 0.25%, not dead"}
            ]]
        })
    ]
};