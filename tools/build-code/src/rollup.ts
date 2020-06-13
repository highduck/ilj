import {Options as TerserOptions, terser} from 'rollup-plugin-terser';
import replace from '@rollup/plugin-replace';
import strip from '@rollup/plugin-strip';
import alias from '@rollup/plugin-alias';
import json from '@rollup/plugin-json';
import glslify from 'rollup-plugin-glslify';
import commonjs from '@rollup/plugin-commonjs';
import visualizer from 'rollup-plugin-visualizer';
import {InputOptions, OutputOptions, Plugin, rollup} from 'rollup';

import Babel from '@rollup/plugin-babel';
import NodeResolve from '@rollup/plugin-node-resolve';
import path from "path";

const {babel} = Babel;
const {nodeResolve} = (NodeResolve as unknown) as { nodeResolve: (opts?: any) => Plugin };

export interface CompileBundleOptions {
    inputMain?: string;
    modules?: boolean;
    compat?: boolean;
    mode?: 'development' | 'production';
    platform?: 'android' | 'web' | 'ios';
    target?: string;
    stats?: boolean;
    minify?: boolean;
    dir?: string;
    verbose?: boolean;
}

export async function compileBundle(options?: CompileBundleOptions) {
    const platform = options?.platform ?? 'web';
    const target = options?.target ?? platform;
    const mode: string = options?.mode ?? 'development';
    const isProduction = mode === 'production';
    const stats = options?.stats ?? isProduction;
    const minify = options?.minify ?? isProduction;
    const modules = options?.modules ?? !isProduction;
    const compat = options?.compat ?? false;
    const dir = options?.dir ?? 'www';
    const verbose = options?.verbose ?? false;
    const inputMain = options?.inputMain ?? 'dist/esm/index.js';

    // const compat = options?.compat || (isProduction && platform === 'web'); // modules force enable modern style

    function getTerserOptions(): undefined | TerserOptions {
        if (platform === 'android') {
            return {
                ecma: 8
            };
        }
        if (!compat) {
            return {
                ecma: 8,
                safari10: true
            };
        }
        return undefined;
    }

    function getBabelOptions() {
        let options: any = {
            babelHelpers: 'bundled',
            babelrc: false,
            // extensions: [...DEFAULT_EXTENSIONS, 'ts'],
            exclude: /node_modules/,
            presets: [[]]
        };

        if (compat) {
            if (platform === 'android') {
                options.presets = [[
                    "@babel/preset-env", {
                        debug: verbose,
                        targets: {
                            android: 37 // 5.0 (api level 21)
                        },
                        useBuiltIns: "usage",
                        corejs: 3
                    }
                ]];
            } else {
                options.presets = [[
                    "@babel/preset-env", {
                        targets: "> 0.25%, not dead",
                        useBuiltIns: "usage",
                        corejs: 3,
                        modules: false,
                        spec: true,
                        forceAllTransforms: true,
                        debug: verbose,
                    }
                ]];
            }
        } else {
            options.presets = [[
                "@babel/preset-env", {
                    bugfixes: true,
                    targets: {esmodules: true},
                    debug: verbose,
                }
            ]];
        }
        return options;
    }

    async function rollupBuild() {

        const plugins: Plugin[] = [];

        if (modules) {
            // plugins.push(virtual({
            //     'howler': `export default {Howler, Howl}`,
            //     'planck-js': 'export default planck'
            // }))
        }

        plugins.push(
            nodeResolve({
                preferBuiltins: true
            }),
            commonjs(),
            alias({
                entries: [
                    {find: '@AppConfig', replacement: 'dist/esm/AppConfig.js'}
                ]
            }),
        );

        if (isProduction) {
            plugins.push(strip({
                include: /\.jsx?$/
            }));
        }

        plugins.push(
            replace({
                values: {
                    'process.env.NODE_ENV': JSON.stringify(mode),
                    'process.env.PRODUCTION': JSON.stringify(isProduction),
                    'process.env.PLATFORM': JSON.stringify(platform),
                    'process.env.TARGET': JSON.stringify(target),
                }
            }),
            babel(getBabelOptions()),
            json(),
            glslify({
                include: [/\.glsl/]
            })
        );

        if (minify) {
            plugins.push(terser(getTerserOptions()));
        }

        if (stats) {
            const postfix = compat ? '.all' : '';
            plugins.push(
                visualizer({
                    filename: `dist/stats${postfix}.html`,
                    sourcemap: minify
                })
            );
        }

        const input: InputOptions = {
            input: inputMain,
            preserveModules: modules,
            plugins
        };

        if (!compat && !modules) {
            input.manualChunks = (id) => {
                if (id.includes('node_modules')) {
                    // vendor
                    if (id.includes('planck-js')) {
                        return 'planck';
                    }
                    return 'support';
                    // id = id.substr(id.indexOf('node_modules/') + 'node_modules/'.length);
                    // id = id.substr(0, id.indexOf('/'));
                    // if (id) {
                    //     return id;
                    // }
                }
            }
        }
        if (!modules) {
            input.external = [
                //     'howler',
                //     'planck-js'
                //    '@capacitor/core'
            ];
        }

        const build = await rollup(input);

        const output: OutputOptions = {
            sourcemap: !isProduction || stats,
            compact: minify,
            globals: {
                //     "howler": '{Howl, Howler}',
                //     "planck-js": 'planck'
                //   '@capacitor/core': '{Capacitor: Capacitor, Plugins: Capacitor.Plugins}'
            }
        };

        if (compat) {
            output.file = path.join(dir, 'all.js');
            output.format = 'iife';
        } else {
            output.dir = path.join(dir, 'modules');
            output.format = 'es';
        }

        await build.write(output);
    }

    return rollupBuild();
}