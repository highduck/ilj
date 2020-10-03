import {CompileBundleOptions} from "./CompileBundleOptions";
import {terser} from 'rollup-plugin-terser';
import {getTerserConfig} from "./terserConfig";
import {Plugin} from 'rollup';

export function getTerserPlugin(options: CompileBundleOptions): undefined | Plugin {
    if (options.minify) {
        const config = getTerserConfig(options);
        if (config) {
            return terser(config);
        }
    }
    return undefined;
}