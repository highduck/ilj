import Babel from '@rollup/plugin-babel';
import {getBabelConfig} from "./babelConfig";
import {CompileBundleOptions} from "./CompileBundleOptions";

const {babel} = Babel;

export function getBabelPlugin(options: CompileBundleOptions) {
    const config = getBabelConfig(options);
    return babel(config);
}