import {buildTypeScript} from "./tsc";
import {compileBundle, CompileBundleOptions, watchBundle} from "./rollup";
import rimraf from "rimraf";
import path from "path";
import {existsSync} from "fs";

export * from './tsc';
export * from './rollup';

export interface BuildOptions {
    compiler?: any;
    bundle?: Partial<CompileBundleOptions>;
    verbose?: boolean;
}

export async function build(options?: BuildOptions) {
    console.debug('build typescript...');
    await buildTypeScript({
        configPath: './tsconfig.esm.json',
        verbose: options?.verbose
    });

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

export async function watch(options?: BuildOptions) {
    console.debug('clean bundle...');
    const dir = options?.bundle?.dir ?? 'www';
    try {
        rimraf.sync(path.join(dir, 'modules'));
        rimraf.sync(path.join(dir, 'all.js'));
    } catch {
    }

    console.debug('watch typescript project...');

    let tsconfig = './tsconfig.esm.json';
    if (!existsSync(tsconfig)) {
        tsconfig = './tsconfig.json';
    }
    const tsc = buildTypeScript({
        configPath: tsconfig,
        verbose: options?.verbose,
        watch: true
    });

    console.debug('watch rollup...');
    const rollup = watchBundle(options?.bundle);

    await Promise.race([tsc, rollup]);
}