/// <reference path="./pnp-webpack-plugin.d.ts" />

import path from 'path';
import fs from 'fs';
import {DefinePlugin} from "webpack";
import {BundleAnalyzerPlugin} from "webpack-bundle-analyzer";
import getPackagePath from "../common/getPackagePath";
import console from '../common/log';
import CopyWebpackPlugin from "copy-webpack-plugin";
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import PnpWebpackPlugin from 'pnp-webpack-plugin';
import {ProjectConfig} from "../config/loadConfig";

// common

function getTsModuleSrc(id: string, from: string): string {
    return path.join(getPackagePath(id, from), "src/index.ts");
}

/// pnp handling
const is_pnp = !!(process.versions as any).pnp;
if (is_pnp) {
    console.warn("PNP detected!!!");
}

function addPnp(config: any) {
    if (is_pnp) {
        config.resolve.plugins.push(PnpWebpackPlugin);
        // resolve plugins from there
        config.resolveLoader.plugins.push(PnpWebpackPlugin.moduleLoader(module));
    }
}

function wrapPnp(opts: any) {
    return is_pnp ? Object.assign(PnpWebpackPlugin.tsLoaderOptions(), opts) : opts;
}

function createTsLoaderConfig(basedir: string, live: boolean) {
    const tsConfigPath = path.resolve(basedir, 'tsconfig.json');
    if (!fs.existsSync(tsConfigPath)) {
        console.error(`tsconfig.json not found`);
        console.info(`in path ${tsConfigPath}`);
    }
    return {
        loader: require.resolve('ts-loader'),
        options: wrapPnp({
            transpileOnly: false,
            experimentalWatchApi: true,
            configFile: path.resolve(basedir, 'tsconfig.json')
        })
    };
}

export function createWebpackConfig(projectConfig: ProjectConfig, mode?: string, analyzer: boolean = false, live: boolean = false): any {
    const baseDir = projectConfig.basedir;
    const platform = projectConfig.platform;
    const targetName = projectConfig.name;
    if (!mode) {
        mode = 'production';
    }
    const getPath = (...segments: string[]) => path.resolve(baseDir, ...segments);

    const isDevelopment = mode !== 'production';
    const config = {
        stats: 'minimal',
        mode: mode,
        entry: getPath("./src/index.ts"),
        output: {
            path: projectConfig.appdir,
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
                "@AppConfig": getPath('src/AppConfig')
            } as any
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: [createTsLoaderConfig(projectConfig.basedir, live)]
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
            new CopyWebpackPlugin(({
                patterns: [{
                    from: getPath("./public")
                }]
            } as any) as undefined),
            new DefinePlugin({
                'process.env.PRODUCTION': JSON.stringify(!isDevelopment),
                'process.env.PLATFORM': JSON.stringify(platform),
                'process.env.TARGET': JSON.stringify(targetName),
            }),
            new ForkTsCheckerWebpackPlugin(wrapPnp({
                tsconfig: getPath('tsconfig.json'),
                typescript: require.resolve('typescript'),
            })),
        ]
    };

    addPnp(config);

    if (live) {
        config.resolve.alias["@highduck/core"] = getTsModuleSrc('@highduck/core', baseDir);
        config.resolve.alias["@highduck/anijson"] = getTsModuleSrc('@highduck/anijson', baseDir);
        config.resolve.alias["@highduck/math"] = getTsModuleSrc('@highduck/math', baseDir);
        config.resolve.alias["@highduck/live-inspector"] = getTsModuleSrc('@highduck/live-inspector', baseDir);
    }

    if (isDevelopment) {
        (config as any).devtool = 'inline-source-map';
    } else {
        // config.devtool = '';
        // config.optimization.runtimeChunk = 'single';
    }

    if (analyzer) {
        config.plugins.push(new BundleAnalyzerPlugin({
            analyzerMode: 'static'
        }));
        (config.optimization as any).concatenateModules = false;
    }

    if (platform !== 'web') {
        (config.externals as any[]).push({
            '@capacitor/core': '{Capacitor: Capacitor, Plugins: Capacitor.Plugins}'
        });
    }

    return config;
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
