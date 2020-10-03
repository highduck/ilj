import path from "path";
import {OutputOptions, rollup} from 'rollup';
import {CompileBundleOptions} from "./CompileBundleOptions";
import {createOutputPlugins, getRollupInput} from "./createRollupConfig";

export async function buildRollup(options: CompileBundleOptions) {
    const input = getRollupInput(options);
    const build = await rollup(input);

    const output: OutputOptions = {
        sourcemap: options.sourceMap,
        compact: options.minify,
        plugins: createOutputPlugins(options),
        strict: true
    };

    // TODO: for `watch` as well
    // if (opts.platform !== 'web') {
    //     output.global = {
    //         '@capacitor/core': 'Capacitor'
    //     };
    // }

    if (options.compat) {
        output.file = path.join(options.dir, 'all.js');
        output.format = 'iife';
        console.log(input);
    } else {
        output.dir = path.join(options.dir, 'modules');
        output.format = 'es';
    }

    if (!options.compat && !options.modules) {
        output.manualChunks = (id) => {
           // console.info(id);
            if (id.includes('@highduck/box2d')) {
                return 'box2d';
            } else if (id.includes('capacitor')) {
                return 'capacitor';
            } else if (id.includes('ilj/engine')) {
                return 'engine';
            } else if (id.includes('ilj/std')) {
                return 'std';
            } else if (id.includes('node_modules')) {
                // vendor
                return 'support';
            }
            return undefined;
        }
    }

    await build.write(output);
}
