import path from 'path';
import fs from 'fs';
import {Configuration, DefinePlugin, Plugin} from "webpack";
import {BundleAnalyzerPlugin} from "webpack-bundle-analyzer";
import getPackagePath from "../common/getPackagePath";
import console from '../common/log';
import CopyWebpackPlugin from "copy-webpack-plugin";
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import {BuildMode, NProjectTarget} from "../proj/NProject";

// common

function getTsModuleSrc(id: string, from: string): string {
    return path.join(getPackagePath(id, from), "src/index.ts");
}

function createTsLoaderConfig(basedir: string, live: boolean) {
    const tsConfigPath = path.resolve(basedir, 'tsconfig.json');
    if (!fs.existsSync(tsConfigPath)) {
        console.error(`tsconfig.json not found`);
        console.info(`in path ${tsConfigPath}`);
    }
    const config = {
        loader: require.resolve('ts-loader'),
        options: {
            transpileOnly: false,
            experimentalWatchApi: false,
            configFile: path.resolve(basedir, 'tsconfig.json')
        }
    };
    console.debug(config);
    return config;
}

export function createWebpackConfig(projectConfig: NProjectTarget, mode?: BuildMode, analyzer: boolean = false, live: boolean = false): Configuration {
    const platform = projectConfig.platform;
    const targetName = projectConfig.name;
    if (!mode) {
        mode = 'production';
    }
    return createWebpackConfig2(targetName, projectConfig.targetPath, projectConfig.mainPath, platform, mode, analyzer, live);
}

export function createDevServerConfig(baseDir: string) {
    return {
        watchContentBase: true,
        contentBase: path.resolve(baseDir, "./public"),
        compress: true,
        host: '0.0.0.0',
        port: 9000,
        useLocalIp: true,
        open: true,
        // hot: true,
        http2: true,
        stats: {
            preset: 'minimal',
            colors: true,
            chunks: false
        }
    };
}

function castToPlugin(a: any): Plugin {
    return a as Plugin;
}

export function createWebpackConfig2(
    target: string,
    targetPath: string,
    mainPath: string,
    platform: string,
    mode: BuildMode,
    analyzer: boolean,
    live: boolean
): Configuration {
    const getMainPath = (...segments: string[]) => path.resolve(mainPath, ...segments);

    const isDevelopment = mode !== 'production';
    const config: Configuration = {
        stats: 'minimal',
        mode: mode,
        entry: getMainPath("./src/index.ts"),
        output: {
            path: path.join(targetPath, 'www'),
            filename: "bundle.js"
        },
        optimization: {},
        externals: [],
        resolveLoader: {
            plugins: []
        },
        resolve: {
            plugins: [],
            extensions: [".ts", ".tsx", ".js", ".jsx", ".glsl", ".css"],
            alias: {
                "@AppConfig": getMainPath('src/AppConfig')
            } as any
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: [createTsLoaderConfig(mainPath, live)]
                },
                {
                    test: /\.glsl$/,
                    loader: require.resolve('webpack-glsl-loader')
                },
                {
                    test: /\.css$/i,
                    use: [require.resolve('style-loader'), require.resolve('css-loader')]
                },
            ]
        },
        plugins: [
            castToPlugin(new CopyWebpackPlugin({
                patterns: [{
                    from: getMainPath("./public")
                }]
            })),
            new DefinePlugin({
                'process.env.PRODUCTION': JSON.stringify(!isDevelopment),
                'process.env.PLATFORM': JSON.stringify(platform),
                'process.env.TARGET': JSON.stringify(target),
            }),
            new ForkTsCheckerWebpackPlugin({
                tsconfig: getMainPath('tsconfig.json'),
                typescript: require.resolve('typescript'),
            })
        ]
    };

    // if (live) {
    config.resolve!.alias!["@highduck/core"] = getTsModuleSrc('@highduck/core', mainPath);
    config.resolve!.alias!["@highduck/anijson"] = getTsModuleSrc('@highduck/anijson', mainPath);
    config.resolve!.alias!["@highduck/math"] = getTsModuleSrc('@highduck/math', mainPath);
    config.resolve!.alias!["@highduck/live-inspector"] = getTsModuleSrc('@highduck/live-inspector', mainPath);
    // }

    if (isDevelopment) {
        (config as any).devtool = 'inline-source-map';
    } else {
        // config.devtool = '';
        // config.optimization.runtimeChunk = 'single';
    }

    if (analyzer) {
        config.plugins!.push(castToPlugin(new BundleAnalyzerPlugin({
            analyzerMode: 'static'
        })));
        (config.optimization as any).concatenateModules = false;
    }

    if (platform !== 'web') {
        (config.externals as any[]).push({
            '@capacitor/core': '{Capacitor: Capacitor, Plugins: Capacitor.Plugins}'
        });
    }

    // console.debug(config);

    return config;
}