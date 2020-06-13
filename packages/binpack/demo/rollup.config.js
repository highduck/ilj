import nodeResolve from '@rollup/plugin-node-resolve';
import {terser} from 'rollup-plugin-terser';
import {babel} from '@rollup/plugin-babel';
import analyze from 'rollup-plugin-analyzer';
import typescript from "rollup-plugin-typescript2";
import { DEFAULT_EXTENSIONS } from '@babel/core';

export default {
    input: 'dist/esm/index.js',
    output: [
        {
            file: 'dist/module.min.js',
            format: 'esm',
            name: 'binpack',
            sourcemap: true,
            plugins: [
                terser({
                    ecma: 8,
                    safari10: true
                })
            ]
        },
        {
            file: 'dist/module.js',
            format: 'esm',
            name: 'binpack',
            sourcemap: true,
        }
    ],
    plugins: [
        analyze(),
        nodeResolve(),
        typescript({tsconfig:'tsconfig.json'}),
        babel({
            babelHelpers: 'bundled',
            babelrc: false,
            exclude: 'node_modules/**',
            extensions: [...DEFAULT_EXTENSIONS, 'ts'],
            presets: [[
                "@babel/preset-env", {
                    bugfixes: true,
                    targets: {esmodules: true}
                }
            ]]
        })
    ]
};