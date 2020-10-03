import path from "path";
import {CompileBundleOptions} from "./CompileBundleOptions";
import {RollupWatcher, RollupWatchOptions, watch} from 'rollup';
import {createOutputPlugins, getRollupInput} from "./createRollupConfig";

export async function watchBundle(options: CompileBundleOptions): Promise<RollupWatcher> {
    return new Promise((resolve, reject) => {
        const watcher = createRollupWatcher(options);
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

function createRollupWatcher(opts: CompileBundleOptions) {
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

