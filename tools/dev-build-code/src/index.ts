import {TSCompileOptions} from "./compilation/tsc/TSCompileOptions";
import {buildTypeScript, watchTypeScript} from "./compilation/tsc/build";
import {buildRollup} from "./compilation/rollup/build";
import rimraf from "rimraf";
import path from "path";
import {existsSync, readFileSync} from "fs";
import {CompileBundleOptions} from "./compilation/rollup/CompileBundleOptions";
import {watchBundle} from "./compilation/rollup/watch";
import {fillDefaultOptionsRollup} from "./compilation/rollup/fillDefaultOptionsRollup";

export type BuildOptions = TSCompileOptions & CompileBundleOptions;

function resolveTSConfig(tsconfig?: string): string {
    if (tsconfig === undefined) {
        for (const g of [
            './tsconfig.project.json',
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
    const patterns = [
        path.join(dir, 'modules'),
        path.join(dir, 'all.js*'),
        '**/*.tsbuildinfo'
    ];
    let success = true;
    for (const pattern of patterns) {
        try {
            rimraf.sync(pattern);
        } catch {
            success = false;
        }
    }
    return success;
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
        const appConfig: Partial<Pkg> = JSON.parse(readFileSync('./app-config.json', 'utf8'));
        opts.version = appConfig.version;
        opts.versionCode = appConfig.versionCode;
    } catch {
    }

    try {
        const pkg: Partial<Pkg> = JSON.parse(readFileSync('./package.json', 'utf8'));
        opts.inputMain = pkg.main;
        opts.version = opts.version ?? pkg.version;
        opts.versionCode = opts.versionCode ?? pkg.versionCode;
    } catch {
        console.warn('package.json not found, use default values');
    }
    return opts;
}

export async function build(options?: Partial<BuildOptions>) {
    const opts = setDefaults(options);

    console.debug('clean output...');
    cleanOutput(opts);

    console.debug('build typescript...');
    await buildTypeScript(opts);

    console.debug('rollup bundle...');
    const bundleConfig = fillDefaultOptionsRollup(opts);
    bundleConfig.compat = false;
    const tasks = [buildRollup(bundleConfig)];
    if (bundleConfig.mode === 'production') {
        const compatConfig = Object.assign({}, bundleConfig);
        compatConfig.compat = true;
        tasks.push(buildRollup(compatConfig));
    }
    await Promise.all(tasks);
}

export async function watch(options?: Partial<BuildOptions>) {
    const opts = setDefaults(options);

    cleanOutput(opts);
    console.debug('build all TS references before watch...');
    await buildTypeScript(opts);

    console.debug('start watch typescript project...');
    opts.force = false;
    const tscProcess = watchTypeScript(opts);

    console.debug('watch rollup...');
    const watcher = await watchBundle(fillDefaultOptionsRollup(opts)); // wait start

    return {watcher, tscProcess};
}