import path from "path";
import console from "../common/log";
import lconsole from "../common/log";
import {createDevServerConfig, createWebpackConfig2} from "../iljwebpack/createConfig";
import webpack from "webpack";
import WebpackDevServer from "webpack-dev-server";
import {syncPlatformProject} from "../platforms/syncPlatformProject";
import * as ip from "internal-ip";
import {deleteFolderRecursive} from "../common/utility";
import fs from "fs";
import getPackagePath from "../common/getPackagePath";

export type BuildMode = 'development' | 'production';
export type PlatformType = 'web' | 'android' | 'ios';

export interface NProjectConfigDto {
    name?: string;
    targets?: { [key: string]: NTargetConfigDto };
}

export interface NTargetConfigDto {
    name?: string; // override name
    platform?: PlatformType;
    pathToTarget?: string; //  by default '{basedir}/{target.name}/'
    main?: string; // main module package name
}

export class NProjectTarget {

    platform: PlatformType;

    // base dir for target package
    targetPath: string;

    mainPath: string;
    mainModule?: string;

    _pathToTarget?: string;

    constructor(readonly name: string, config?: NTargetConfigDto) {
        this.platform = config?.platform ?? 'web';
        this.mainPath = this.targetPath = '.';
        this.mainModule = config?.main;
        this._pathToTarget = config?.pathToTarget;
    }

    static load(basedir: string): NProjectTarget | undefined {
        let config: NTargetConfigDto | undefined = undefined;
        try {
            config = require(path.resolve(basedir, "ilj.target.js")) as NTargetConfigDto;
        } catch {
        }
        let name = config?.name ?? autoResolveName(basedir, 'test');
        const target = new NProjectTarget(name, config);
        target.targetPath = path.resolve(basedir, target._pathToTarget ?? '.');
        target.mainPath = target.targetPath;
        if (target.mainModule) {
            console.info("main package: " + target.mainModule);
            target.mainPath = fs.realpathSync(getPackagePath(target.mainModule, basedir));
            if (!fs.existsSync(target.mainPath)) {
                console.error(`Main package ${target.mainModule} not found`);
                console.info(`not exists: ${target.mainPath}`);
                return undefined;
            }
        }
        return target;
    }

    deleteWWW() {
        deleteFolderRecursive(path.join(this.targetPath, 'www'));
    }
}

export interface NRunOptions {
    target?: string;
    mode?: BuildMode;
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
            this.name = autoResolveName(basedir, 'ilj-project');
        }

        const targetsObj = config?.targets ?? {};
        for (const t of Object.keys(targetsObj)) {
            const target = new NProjectTarget(t, targetsObj[t]);
            target.targetPath = path.resolve(basedir, target._pathToTarget ?? '.');
            target.mainPath = basedir;
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
        target.deleteWWW();

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

    createCompiler(target: NProjectTarget, mode: BuildMode, analyzer: boolean = false, live: boolean = false): webpack.Compiler {
        const config = createWebpackConfig2(
            target.name,
            target.targetPath,
            target.mainPath,
            target.platform,
            mode,
            analyzer,
            live
        );
        return webpack(config);
    }

    async compile(compiler: webpack.Compiler, target: NProjectTarget, live: boolean = false) {
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
                        syncPlatformProject(target.platform, target.targetPath);
                    }
                });
            }
        });
    }
}


function autoResolveName(dir: string, defaultName = 'local') {
    let name = '';
    try {
        const packageConfig = require(path.resolve(dir, 'package.json'));
        name = packageConfig.name;
        if (!name) {
            name = path.basename(path.resolve(dir));
        }
    } catch {
    }
    return name || defaultName;
}