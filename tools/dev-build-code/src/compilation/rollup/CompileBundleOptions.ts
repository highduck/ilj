export interface CompileBundleOptions {
    platform: 'android' | 'web' | 'ios';
    target: string;
    mode: 'development' | 'production';
    flags: string[];
    stats: boolean;
    minify: boolean;
    modules: boolean;
    compat: boolean;
    dir: string;
    verbose: boolean;
    inputMain: string;
    version: string;
    versionCode: number;
    debug: boolean;
    sourceMap: boolean;
}