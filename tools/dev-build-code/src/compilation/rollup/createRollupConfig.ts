import replace from '@rollup/plugin-replace';
import strip from '@rollup/plugin-strip';
import alias from '@rollup/plugin-alias';
import json from '@rollup/plugin-json';
import glslify from 'rollup-plugin-glslify';
import commonjs from '@rollup/plugin-commonjs';
import visualizer from 'rollup-plugin-visualizer';
import {InputOptions, Plugin} from 'rollup';
import postcss from 'rollup-plugin-postcss';
import nodeResolve from '@rollup/plugin-node-resolve';
import sourcemaps from 'rollup-plugin-sourcemaps';
import externalGlobals from 'rollup-plugin-external-globals';
import {CompileBundleOptions} from "./CompileBundleOptions";
import {getBabelPlugin} from "./babelPlugin";
import {getTerserPlugin} from "./terserPlugin";


export function getRollupInput(options: CompileBundleOptions): InputOptions {

    const isProduction = options.mode === 'production';

    const plugins: Plugin[] = [];

    if (options.sourceMap) {
        plugins.push(sourcemaps());
    }
    plugins.push(nodeResolve({preferBuiltins: true, /*browser: true,*/}));
    plugins.push(commonjs({
        // dynamicRequireTargets: '@highduck/capacitor-firebase'
        // transformMixedEsModules: true,
        // ignoreGlobal: true
    }));
    plugins.push(alias({
        entries: [
            {
                find: '@AppConfig',
                replacement: 'dist/esm/AppConfig.js'
            }
        ]
    }));

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

    plugins.push(getBabelPlugin(options));
    plugins.push(json());
    plugins.push(glslify({include: [/\.glsl/]}));
    plugins.push(postcss({plugins: []}));

    const terser = getTerserPlugin(options);
    if (terser) {
        plugins.push(terser);
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

export function createOutputPlugins(opts: CompileBundleOptions): Plugin[] {
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