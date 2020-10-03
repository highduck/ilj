import {CompileBundleOptions} from "./CompileBundleOptions";

export function fillDefaultOptionsRollup(options?: Partial<CompileBundleOptions>): CompileBundleOptions {
    const platform = options?.platform ?? 'web';
    const target = options?.target ?? platform;
    const mode = options?.mode ?? 'development';
    const isProduction = mode === 'production';
    const isDevelopment = mode === 'development';
    const stats = options?.stats ?? !isProduction;
    const minify = options?.minify ?? isProduction;
    const modules = options?.modules ?? !isProduction;
    const compat = options?.compat ?? false;
    const dir = options?.dir ?? 'www';
    const verbose = options?.verbose ?? false;
    const inputMain = options?.inputMain ?? 'dist/esm/index.js';
    const version = options?.version ?? '1.0.0';
    const versionCode = options?.versionCode ?? 1;
    const debug = options?.debug ?? false;//!isProduction;
    const sourceMap = options?.sourceMap ?? (stats || debug || isDevelopment);
    const flags = options?.flags ?? [];
    return {
        platform, target, mode, stats, minify, modules, compat, dir, verbose,
        inputMain, version, versionCode, debug, sourceMap, flags
    };
}