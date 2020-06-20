import {buildTypeScript, TypeScriptCompileOptions} from "./tsc";
import {compileBundle, CompileBundleOptions, watchBundle} from "./rollup";
import rimraf from "rimraf";
import path from "path";
import {existsSync, readFileSync} from "fs";

export * from './tsc';
export * from './rollup';

export type BuildOptions = TypeScriptCompileOptions & CompileBundleOptions;

function resolveTSConfig(tsconfig?: string): string {
    if (tsconfig === undefined) {
        for (const g of [
            './tsconfig.esm.json',
            './tsconfig.build.json',
            './tsconfig.json'
        ]) {
            if (existsSync(g)) {
                tsconfig = g;
                break;
            }
        }
    }
    if (tsconfig === undefined) {
        throw 'cannot guess default tsconfig!';
    } else if (!existsSync(tsconfig)) {
        throw 'tsconfig does not exist: ' + tsconfig;
    }
    return tsconfig;
}

function cleanOutput(options: Partial<BuildOptions>) {
    console.debug('clean destination folder...');

    const dir = options.dir ?? 'www';
    try {
        rimraf.sync(path.join(dir, 'modules'));
        rimraf.sync(path.join(dir, 'all.js*'));
        rimraf.sync('**/*.tsbuildinfo');
    } catch {
        return false;
    }
    return true;
}

interface Pkg {
    version: string,
    versionCode: number,
    main: string
}

function setDefaults(options?: Partial<BuildOptions>): Partial<BuildOptions> {
    const opts: Partial<BuildOptions> = options ?? {};
    opts.tsconfig = resolveTSConfig(opts.tsconfig);

    try {
        const pkg: Partial<Pkg> = JSON.parse(readFileSync('./package.json', 'utf8'))
        opts.inputMain = pkg.main;
        opts.version = pkg.version;
        opts.versionCode = pkg.versionCode;
    } catch {
        console.error('package.json not found, use default values');
    }
    return opts;
}

export async function build(options?: Partial<BuildOptions>) {
    const opts = setDefaults(options);

    console.debug('build typescript...');
    await buildTypeScript(opts);

    cleanOutput(opts);

    console.debug('rollup to modules...');
    opts.compat = false;
    await compileBundle(opts);

    if (opts.mode === 'production') {
        console.debug('rollup compat... (IIFE fallback)');
        opts.compat = true;
        await compileBundle(opts);
    }
}

export async function watch(options?: Partial<BuildOptions>) {
    const opts = setDefaults(options);

    cleanOutput(opts);
    console.debug('build all TS references before watch...');
    opts.watch = false;
    await buildTypeScript(opts);

    console.debug('start watch typescript project...');
    opts.watch = true;
    opts.force = false;
    const tsc = buildTypeScript(opts);

    console.debug('watch rollup...');
    const watcher = await watchBundle(opts); // wait start

    return {watcher, tsc};
    // await rollup;
}