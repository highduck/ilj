import webpack from "webpack";

import {createWebpackConfig, createDevServerConfig} from "./createConfig";

import WebpackDevServer from "webpack-dev-server";

import * as ip from "internal-ip";
import {syncPlatformProject} from "../platforms/syncPlatformProject";
import lconsole from "../common/log";
import {BuildMode, NProjectTarget} from "../proj/NProject";

export async function build(projectConfig: NProjectTarget, mode: BuildMode, analyzer: boolean = false, live: boolean = false) {
    const baseDir = projectConfig.root;
    const config = createWebpackConfig(projectConfig, mode, analyzer, live);
    return new Promise((resolve, reject) => {
        const compiler = webpack(config as webpack.Configuration);
        if (live) {
            const devServer = createDevServerConfig(baseDir);
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
                    syncPlatformProject(projectConfig.platform, projectConfig.root);
                }
            });
        }

    });
}