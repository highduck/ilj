import {CompileBundleOptions} from "./CompileBundleOptions";
import {MinifyOptions} from 'terser';
import {Options as TerserOptions} from 'rollup-plugin-terser';

const readableMinify = false;

export function getTerserConfig(options: CompileBundleOptions): undefined | TerserOptions {
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
        mangle: readableMinify ? false : {
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