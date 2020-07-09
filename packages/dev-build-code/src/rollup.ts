import {Options as TerserOptions, terser} from 'rollup-plugin-terser';
import replace from '@rollup/plugin-replace';
import strip from '@rollup/plugin-strip';
import alias from '@rollup/plugin-alias';
import json from '@rollup/plugin-json';
import glslify from 'rollup-plugin-glslify';
import commonjs from '@rollup/plugin-commonjs';
import visualizer from 'rollup-plugin-visualizer';
import {InputOptions, OutputOptions, Plugin, rollup, RollupWatcher, RollupWatchOptions, watch} from 'rollup';
import postcss from 'rollup-plugin-postcss';
import Babel from '@rollup/plugin-babel';
import nodeResolve from '@rollup/plugin-node-resolve';
import path from "path";

const {babel} = Babel;

export async function compileBundle(options?: Partial<CompileBundleOptions>) {
    return rollupBuild(fillDefaults(options));
}

export async function watchBundle(options?: Partial<CompileBundleOptions>): Promise<RollupWatcher> {
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
            if (event.code === 'END') {
                resolve(watcher);
            }
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
    version: string;
    versionCode: number;
    debug: boolean;
    sourceMap: boolean;
}

function fillDefaults(options?: Partial<CompileBundleOptions>): CompileBundleOptions {
    const platform = options?.platform ?? 'web';
    const target = options?.target ?? platform;
    const mode = options?.mode ?? 'development';
    const isProduction = mode === 'production';
    const isDevelopment = mode === 'development';
    const stats = options?.stats ?? !isProduction;
    const minify = options?.minify ?? isProduction;
    const modules = options?.modules ?? !isProduction;
    const compat = options?.compat ?? false;
    const dir = options?.dir ?? 'www';
    const verbose = options?.verbose ?? false;
    // const inputMain = options?.inputMain ?? 'src/index.ts';
    const inputMain = options?.inputMain ?? 'dist/esm/index.js';
    const version = options?.version ?? '1.0.0';
    const versionCode = options?.versionCode ?? 1;
    const debug = options?.debug ?? false;//!isProduction;
    const sourceMap = options?.sourceMap ?? (stats || debug || isDevelopment);
    return {
        platform, target, mode, stats, minify, modules, compat, dir, verbose,
        inputMain, version, versionCode, debug, sourceMap
    };
}

function getTerserOptions(options: CompileBundleOptions): undefined | TerserOptions {
    if (!options.minify) {
        return undefined;
    }

    const opts: TerserOptions = {
        ecma: 8,
        compress: {
            passes: 2,
            // reduce_funcs: false,
            // reduce_vars: false,
            keep_infinity: true,
        },
        mangle: {
            module: !options.compat,
            // properties: {
            //     keep_quoted: true,
            //     reserved:[
            //         "HowlerGlobal", "Howl", "Sound",
            //         "WebPluginRegistry", "WebPlugins", "WebPlugin",
            //         "firebase",
            //         "Capacitor", "Plugins",
            //         "planck",
            //         "window"
            //     ]
            // }
        },
        toplevel: true,
        safari10: true,
        output: {
            beautify: options.debug
        }
    };

    if (options.platform === 'android') {
        opts.safari10 = false; // no need for android
    }

    return opts;
}

function getBabelConfig(options: CompileBundleOptions) {
    const compat = options.compat;
    const platform = options.platform;
    const verbose = options.verbose;

    let config: any = {
        sourceMaps: options.sourceMap,
        // currently we always generate typescript js maps
        inputSourceMap: true,
        babelHelpers: 'bundled',
        babelrc: false,
        exclude: [/\/core-js\//], // for `useBuiltIns: "usage"`
        presets: [],
        plugins: []
    };
    // if (compat) {
    //     config.plugins.push(['@babel/plugin-transform-destructuring']);
    // }

    if (platform === 'android') {
        // 5.0 (api level 21)
        const androidCompat = 37;
        const androidModern = 61;
        config.presets.push([
            "@babel/preset-env", {
                debug: verbose,
                targets: {
                    android: compat ? androidCompat : androidModern
                },
                useBuiltIns: "usage",
                corejs: 3
            }
        ]);
    } else {
        if (compat) {
            config.presets.push([
                "@babel/preset-env", {
                    targets: "> 0.25%, not dead",
                    useBuiltIns: "usage",
                    corejs: 3,
                    modules: false,
                    spec: true,
                    forceAllTransforms: true,
                    debug: verbose,
                }
            ]);
        } else {
            config.presets.push([
                "@babel/preset-env", {
                    bugfixes: true,
                    targets: {esmodules: true},
                    debug: verbose,
                }
            ]);
        }
    }
    return config;
}

function getRollupInput(options: CompileBundleOptions): InputOptions {

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
            include: /\.[jt]sx?$/
        }));
    }

    const planckDev = false;

    plugins.push(
        replace({
            values: {
                'process.env.NODE_ENV': JSON.stringify(options.mode),
                'process.env.PRODUCTION': JSON.stringify(isProduction),
                'process.env.PLATFORM': JSON.stringify(options.platform),
                'process.env.TARGET': JSON.stringify(options.target),
                'process.env.APP_VERSION': JSON.stringify(options.version),
                'process.env.APP_VERSION_CODE': JSON.stringify(options.versionCode),
                'DEBUG': JSON.stringify(options.debug),
                'ASSERT': JSON.stringify(options.debug),
                'PLANCK_DEBUG': JSON.stringify(planckDev),
                'PLANCK_ASSERT': JSON.stringify(planckDev)
            }
        }),
        babel(getBabelConfig(options)),
        json(),
        glslify({
            include: [/\.glsl/]
        }),
        postcss({
            plugins: []
        })
    );

    if (options.minify) {
        const terserOptions = getTerserOptions(options);
        if (terserOptions !== undefined) {
            plugins.push(terser(terserOptions));
        }
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
        input.preserveEntrySignatures = false;
        input.manualChunks = (id) => {
            if (id.includes('node_modules')) {
                // vendor
                if (id.includes('planck-js')) {
                    return 'planck';
                }
                return 'support';
            }
            return undefined;
        }
    }
    return input;
}

async function rollupBuild(opts: CompileBundleOptions) {
    const input = getRollupInput(opts);
    const build = await rollup(input);

    const output: OutputOptions = {
        sourcemap: opts.sourceMap,
        compact: opts.minify
    };

    if (opts.compat) {
        output.file = path.join(opts.dir, 'all.js');
        output.format = 'iife';
        console.log(input);
    } else {
        output.dir = path.join(opts.dir, 'modules');
        output.format = 'es';
    }

    await build.write(output);
}

export function rollupWatch(opts: CompileBundleOptions) {
    const isProduction = opts.mode === 'production';

    const options: RollupWatchOptions = {
        ...getRollupInput(opts),
        output: [{
            sourcemap: opts.sourceMap,
            compact: opts.minify,
            dir: path.join(opts.dir, 'modules'),
            format: 'es'
        }],
        watch: {}
    };

    return watch(options);
}

