import {buildTypeScript} from "./tsc";
import {compileBundle, CompileBundleOptions} from "./rollup";
import rimraf from "rimraf";
import path from "path";

export * from './tsc';
export * from './rollup';

export interface BuildOptions {
    compiler?: any;
    bundle?: CompileBundleOptions;
    verbose?: boolean;
}

export async function build(options?: BuildOptions) {
    console.debug('build typescript...');
    if (buildTypeScript({
        configPath: './tsconfig.esm.json',
        verbose: options?.verbose
    })) {
        console.debug('clean bundle...');
        const dir = options?.bundle?.dir ?? 'www';
        try {
            rimraf.sync(path.join(dir, 'modules'));
            rimraf.sync(path.join(dir, 'all.js'));
        } catch {
        }
        console.debug('rollup to modules...');
        await compileBundle(options?.bundle);
        if (options?.bundle?.mode === 'production') {
            console.debug('rollup compat... (IIFE fallback)');
            options.bundle.compat = true;
            await compileBundle(options.bundle);
        }
    }
}