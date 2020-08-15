import {MinifyOptions} from 'terser';
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
import Babel, {RollupBabelInputPluginOptions} from '@rollup/plugin-babel';
import nodeResolve from '@rollup/plugin-node-resolve';
import path from "path";
import sourcemaps from 'rollup-plugin-sourcemaps';
import externalGlobals from 'rollup-plugin-external-globals';

const {babel} = Babel;

const release_profile = false;

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
    flags: string[];
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
    const flags = options?.flags ?? [];
    return {
        platform, target, mode, stats, minify, modules, compat, dir, verbose,
        inputMain, version, versionCode, debug, sourceMap, flags
    };
}

function getTerserOptions(options: CompileBundleOptions): undefined | TerserOptions {
    if (!options.minify) {
        return undefined;
    }

    const opts: MinifyOptions = {
        ecma: options.compat ? 5 : 2015,
        compress: {
            passes: 2,
            hoist_funs: true,
            reduce_funcs: false,
            reduce_vars: false,
            keep_infinity: true,
            negate_iife: false,
            toplevel: true
        },
        mangle: release_profile ? false : {
            toplevel: true,
            // module: !options.compat,
            module: true,
            eval: true,

            // properties: true
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
        // output: {
        //     beautify: options.debug || release_profile
        // }
    };

    if (options.platform === 'android') {
        opts.safari10 = false; // no need for android
    }

    return opts as TerserOptions;
}

function getBabelConfig(options: CompileBundleOptions): RollupBabelInputPluginOptions {
    const compat = options.compat;
    const platform = options.platform;
    const verbose = options.verbose;

    let config: RollupBabelInputPluginOptions = {
        sourceMaps: options.sourceMap,
        // currently we always generate typescript js maps
        inputSourceMap: false as unknown as object,
        babelHelpers: 'bundled',
        babelrc: false,
        exclude: [/\/core-js\//], // for `useBuiltIns: "usage"`
        presets: [],
        plugins: []
    };

    // (modules: false) - do not touch imports exports to allow more effective tree-shaking

    if (platform === 'android') {
        // 5.0 (api level 21)
        const androidCompat = 37;
        const androidModern = 61;
        config.presets!.push([
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
            config.presets!.push([
                "@babel/preset-env", {
                    targets: "> 0.25%, not dead",
                    useBuiltIns: "usage",
                    corejs: 3,
                    spec: true,
                    forceAllTransforms: true,
                    debug: verbose,
                    modules: false,
                }
            ]);
        } else {
            config.presets!.push([
                "@babel/preset-env", {
                    bugfixes: true,
                    targets: {esmodules: true},
                    debug: verbose,
                    modules: false,
                }
            ]);
        }
    }
    return config;
}

function getRollupInput(options: CompileBundleOptions): InputOptions {

    const isProduction = options.mode === 'production';

    const plugins: Plugin[] = [];

    if (options.sourceMap) {
        plugins.push(sourcemaps());
    }
    plugins.push(
        nodeResolve({
            preferBuiltins: true,
            // browser: true,
        }),
        commonjs({
            // dynamicRequireTargets: '@highduck/capacitor-firebase'
            // transformMixedEsModules: true,
            // ignoreGlobal: true
        }),
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

    plugins.push(
        replace({
            values: {
                'process.env.NODE_ENV': JSON.stringify(options.mode),
                'process.env.PRODUCTION': JSON.stringify(isProduction),
                'process.env.PLATFORM': JSON.stringify(options.platform),
                'process.env.TARGET': JSON.stringify(options.target),
                'process.env.APP_VERSION': JSON.stringify(options.version),
                'process.env.APP_VERSION_CODE': JSON.stringify(options.versionCode),
                'process.env.ILJ_PROFILE': JSON.stringify(false),
                'process.env.ILJ_WEBGL_DEBUG': JSON.stringify(false),
                DEBUG: JSON.stringify(options.debug),
                ASSERT: JSON.stringify(options.debug),
                B2_DEBUG: JSON.stringify(options.debug),
                B2_ASSERT: JSON.stringify(options.debug),
                B2_ENABLE_CONTROLLER: JSON.stringify(false),
                B2_ENABLE_PARTICLE: JSON.stringify(false),
                B2_ENABLE_PROFILER: JSON.stringify(false)
            }
        })
    );

    if (options.platform !== 'web') {
        plugins.push(externalGlobals({
            '@capacitor/core': '({Capacitor:Capacitor,Plugins:Capacitor.Plugins})',
            '@highduck/capacitor-firebase': 'undefined'
        }));
    }

    plugins.push(
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
        if (terserOptions) {
            plugins.push(terser(terserOptions));
        }
        // plugins.push(closureCompiler({
        //     charset: 'UTF-8',
        //     // Uncomment to se more information.
        //     // warning_level: 'VERBOSE',
        //     // language_out: 'ECMASCRIPT_2015',
        //     // Angular code contains a lot of non-standard JSDoc tags, like @publicApi.
        //     // These warnings won't appear anyway unless you set warning_level to verbose.
        //     jscomp_off: ['nonStandardJsDocs'],
        //
        //     // Uncomment to attempt advanced optimizations.
        //     // compilation_level: 'ADVANCED',
        //     // Angular uses 'System', which needs an extern in advanced mode.
        //     // externs: ['./externs.js']
        //
        // }));
    }

    const input: InputOptions = {
        input: options.inputMain,
        //preserveModules: options.modules,
        plugins
    };

    // if (options.platform !== 'web') {
    //     input.external = [
    //         '@capacitor/core',
    //         '@highduck/capacitor-firebase'
    //     ];
    // }

    if (!options.compat && !options.modules) {
        // input.preserveEntrySignatures = 'strict';
        // input.manualChunks = (id) => {
        //     if (id.includes('node_modules')) {
        //         // vendor
        //         if (id.includes('box2d')) {
        //             return 'box2d';
        //         }
        //         return 'support';
        //     }
        //     return undefined;
        // }
    }
    return input;
}

function createOutputPlugins(opts: CompileBundleOptions): Plugin[] {
    const plugins: Plugin[] = [];

    if (opts.stats) {
        const postfix = opts.compat ? '.all' : '';
        plugins.push(
            visualizer({
                filename: `dist/${opts.target}/stats${postfix}.html`,
                sourcemap: opts.sourceMap
            })
        );
    }

    return plugins;
}

async function rollupBuild(opts: CompileBundleOptions) {
    const input = getRollupInput(opts);
    const build = await rollup(input);

    const output: OutputOptions = {
        sourcemap: opts.sourceMap,
        compact: opts.minify,
        plugins: createOutputPlugins(opts),
        strict: true
    };

    // TODO: for `watch` as well
    // if (opts.platform !== 'web') {
    //     output.global = {
    //         '@capacitor/core': 'Capacitor'
    //     };
    // }

    if (opts.compat) {
        output.file = path.join(opts.dir, 'all.js');
        output.format = 'iife';
        console.log(input);
    } else {
        output.dir = path.join(opts.dir, 'modules');
        output.format = 'es';
    }

    if (!opts.compat && !opts.modules) {
        output.manualChunks = (id) => {
            if (id.includes('node_modules')) {
                // vendor
                return 'support';
            } else if (id.includes('box2d.ts')) {
                return 'box2d';
            } else if (id.includes('packages/core') || id.includes('packages/math') || id.includes('packages/anijson')) {
                return 'engine';
            }
            return undefined;
        }
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
            format: 'es',
            plugins: createOutputPlugins(opts)
        }],
        watch: {}
    };

    return watch(options);
}

