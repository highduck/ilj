import {Options as TerserOptions, terser} from 'rollup-plugin-terser';
import replace from '@rollup/plugin-replace';
import strip from '@rollup/plugin-strip';
import alias from '@rollup/plugin-alias';
import json from '@rollup/plugin-json';
import glslify from 'rollup-plugin-glslify';
import commonjs from '@rollup/plugin-commonjs';
import visualizer from 'rollup-plugin-visualizer';
import {InputOptions, OutputOptions, Plugin, rollup, RollupWatchOptions, watch} from 'rollup';

import Babel from '@rollup/plugin-babel';
import NodeResolve from '@rollup/plugin-node-resolve';
import path from "path";

const {babel} = Babel;
const {nodeResolve} = (NodeResolve as unknown) as { nodeResolve: (opts?: any) => Plugin };

export async function compileBundle(options?: Partial<CompileBundleOptions>) {
    return rollupBuild(fillDefaults(options));
}

export async function watchBundle(options?: Partial<CompileBundleOptions>) {
    return new Promise((resolve, reject) => {
        const watcher = rollupWatch(fillDefaults(options));
        watcher.on('event', (event) => {
            // event.code can be one of:
            //   START        — the watcher is (re)starting
            //   BUNDLE_START — building an individual bundle
            //   BUNDLE_END   — finished building a bundle
            //   END          — finished building all bundles
            //   ERROR        — encountered an error while bundling
            console.log(event);
        });
    })
}

export interface CompileBundleOptions {
    platform: 'android' | 'web' | 'ios';
    target: string;
    mode: 'development' | 'production';
    stats: boolean;
    minify: boolean;
    modules: boolean;
    compat: boolean;
    dir: string;
    verbose: boolean;
    inputMain: string;
}

function fillDefaults(options?: Partial<CompileBundleOptions>): CompileBundleOptions {
    const platform = options?.platform ?? 'web';
    const target = options?.target ?? platform;
    const mode = options?.mode ?? 'development';
    const isProduction = mode === 'production';
    const stats = options?.stats ?? isProduction;
    const minify = options?.minify ?? isProduction;
    const modules = options?.modules ?? !isProduction;
    const compat = options?.compat ?? false;
    const dir = options?.dir ?? 'www';
    const verbose = options?.verbose ?? false;
    const inputMain = options?.inputMain ?? 'dist/esm/index.js';
    return {
        platform, target, mode, stats, minify, modules, compat, dir, verbose, inputMain
    };
}

function getTerserOptions(options: CompileBundleOptions): undefined | TerserOptions {
    if (options.platform === 'android') {
        return {
            ecma: 8
        };
    }
    if (!options.compat) {
        return {
            ecma: 8,
            safari10: true
        };
    }
    return undefined;
}

function getBabelConfig(options: CompileBundleOptions) {
    const compat = options.compat;
    const platform = options.platform;
    const verbose = options.verbose;

    let config: any = {
        babelHelpers: 'bundled',
        babelrc: false,
        exclude: /node_modules/,
        presets: [[]]
    };

    if (compat) {
        if (platform === 'android') {
            config.presets = [[
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
            config.presets = [[
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
        config.presets = [[
            "@babel/preset-env", {
                bugfixes: true,
                targets: {esmodules: true},
                debug: verbose,
            }
        ]];
    }
    return config;
}

function getRollupInput(options: CompileBundleOptions):InputOptions {

    const isProduction = options.mode === 'production';

    const plugins: Plugin[] = [];

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
                'process.env.NODE_ENV': JSON.stringify(options.mode),
                'process.env.PRODUCTION': JSON.stringify(isProduction),
                'process.env.PLATFORM': JSON.stringify(options.platform),
                'process.env.TARGET': JSON.stringify(options.target),
            }
        }),
        babel(getBabelConfig(options)),
        json(),
        glslify({
            include: [/\.glsl/]
        })
    );

    if (options.minify) {
        plugins.push(terser(getTerserOptions(options)));
    }

    if (options.stats) {
        const postfix = options.compat ? '.all' : '';
        plugins.push(
            visualizer({
                filename: `dist/stats${postfix}.html`,
                sourcemap: options.minify
            })
        );
    }

    const input: InputOptions = {
        input: options.inputMain,
        //preserveModules: options.modules,
        plugins
    };

    if (!options.compat && !options.modules) {
        input.manualChunks = (id) => {
            if (id.includes('node_modules')) {
                // vendor
                if (id.includes('planck-js')) {
                    return 'planck';
                }
                return 'support';
            }
        }
    }
    return input;
}

async function rollupBuild(opts: CompileBundleOptions) {
    const isProduction = opts.mode === 'production';
    const input = getRollupInput(opts);
    const build = await rollup(input);

    const output: OutputOptions = {
        sourcemap: !isProduction || opts.stats,
        compact: opts.minify
    };

    if (opts.compat) {
        output.file = path.join(opts.dir, 'all.js');
        output.format = 'iife';
    } else {
        output.dir = path.join(opts.dir, 'modules');
        output.format = 'es';
    }

    await build.write(output);
}

export function rollupWatch(opts: CompileBundleOptions) {
    const isProduction = opts.mode === 'production';

    const options:RollupWatchOptions = {
        ...getRollupInput(opts),
        output: [{
            sourcemap: !isProduction || opts.stats,
            compact: opts.minify,
            dir: path.join(opts.dir, 'modules'),
            format: 'es'
        }],
        watch: {
        }
    };

    return watch(options);
}

