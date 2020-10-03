import {RollupBabelInputPluginOptions} from '@rollup/plugin-babel';
import babelPreset from "@babel/preset-env";
import {CompileBundleOptions} from "./CompileBundleOptions";

export function getBabelConfig(options: CompileBundleOptions): RollupBabelInputPluginOptions {
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
                // "@babel/preset-env", {
                babelPreset, {
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
                // "@babel/preset-env", {
                babelPreset, {
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