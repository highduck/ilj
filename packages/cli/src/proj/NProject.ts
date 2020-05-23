import path from "path";
import console from "../common/log";
import lconsole from "../common/log";
import {createDevServerConfig, createWebpackConfig2} from "../iljwebpack/createConfig";
import webpack from "webpack";
import WebpackDevServer from "webpack-dev-server";
import {syncPlatformProject} from "../platforms/syncPlatformProject";
import * as ip from "internal-ip";
import {deleteFolderRecursive} from "../common/utility";

export interface NProjectConfigDto {
    name?: string;
    targets?: { [key: string]: NTargetConfigDto };
}

export interface NTargetConfigDto {
    platform?: NPlatformType;
    // basedir: string;
    // approot: string;
    www?: string;
    root?: string;
}

export type NPlatformType = 'web' | 'android' | 'ios';

export class NProjectTarget {

    platform: NPlatformType;
    www: string;
    root: string;

    constructor(readonly name: string, config?: NTargetConfigDto) {
        this.platform = config?.platform ?? 'web';
        this.www = config?.www ?? 'www';
        this.root = config?.root ?? name;
    }
}

export interface NRunOptions {
    target?: string;
    mode?: string;
    live?: boolean;
    analyze?: boolean;
}

export class NProject {

    static DEFAULT_TARGET = 'pwa';

    name: string;
    readonly targets = new Map<string, NProjectTarget>();

    constructor(readonly basedir: string,
                config?: NProjectConfigDto) {
        if (config?.name !== undefined) {
            this.name = config?.name;
        } else {
            const npmjson = require(path.resolve(basedir, 'package.json'));
            this.name = npmjson.name ?? "ilj-project";
        }

        const targetsObj = config?.targets ?? {};
        for (const t of Object.keys(targetsObj)) {
            const target = new NProjectTarget(t, targetsObj[t]);
            target.root = path.resolve(basedir, target.root);
            target.www = path.resolve(target.root, target.www);
            this.targets.set(t, target);
        }
    }

    async run(options?: NRunOptions) {
        const live = options?.live ?? false;
        const analyze = options?.analyze ?? false;
        const targetName = options?.target ?? NProject.DEFAULT_TARGET;
        const mode = options?.mode ?? 'development';

        const target = this.targets.get(targetName);
        if (target === undefined) {
            return;
        }

        // clean web content output
        deleteFolderRecursive(target.www);

        const compiler = this.createCompiler(target, mode, analyze, live);
        await this.compile(compiler, target, live);
    }

    static load(basedir: string): NProject {
        try {
            const config: NProjectConfigDto = require(path.resolve(basedir, "ilj.project.js"));
            const npmConfig: any = require(path.resolve(basedir, 'package.json'));
            if (config.name === undefined) {
                config.name = npmConfig.name;
            }
            return new NProject(basedir, config);
        } catch {
        }

        return new NProject(basedir, {
            targets: {
                pwa: {
                    platform: 'web'
                }
            }
        });
    }

    createCompiler(target: NProjectTarget, mode: string, analyzer: boolean = false, live: boolean = false):webpack.Compiler {
        const config = createWebpackConfig2(
            target.name,
            target.www,
            this.basedir,
            target.platform,
            mode,
            analyzer,
            live
        ) as webpack.Configuration;
        return webpack(config);
    }

    async compile(compiler:webpack.Compiler, target: NProjectTarget, live: boolean = false) {
        return new Promise((resolve, reject) => {
            if (live) {
                const devServer = createDevServerConfig(this.basedir);
                // https://github.com/webpack/webpack-dev-server/tree/master/examples/cli/https
                const server = (new (WebpackDevServer as any)(compiler, devServer)) as WebpackDevServer;
                const host = devServer.useLocalIp ? (ip.v4.sync() ?? devServer.host) : devServer.host;
                const port = devServer.port;
                server.listen(port, host, () => {
                    lconsole.info('Starting server on https://' + host + ':' + port);
                    resolve();
                });
            } else {
                compiler.run((err, stats) => {
                    console.log(stats.toString({
                        chunks: false,
                        colors: true
                    }));
                    if (err) {
                        console.error(err);
                    }

                    if (!err && !stats.hasErrors()) {
                        syncPlatformProject(target.platform, target.root);
                    }
                });
            }
        });
    }
}