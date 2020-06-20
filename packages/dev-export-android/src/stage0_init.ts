import {mkdirSync, readFileSync, writeFileSync} from "fs";
import path from "path";
import {cap} from "./utils";
import {AndroidProjectContext} from "./context";

function writePkg(ctx: AndroidProjectContext) {
    const pkgPath = path.join(ctx.genDir, 'package.json');

    const dependencies: { [key: string]: string } = {};
    for (const id of ctx.pkg.capacitorPlugins) {
        dependencies[id] = "*";
    }

    console.log('write package.json');
    writeFileSync(pkgPath, JSON.stringify({
        name: "android",
        private: true,
        dependencies
    }));
}

function writeCapConfig(ctx: AndroidProjectContext): any {
    const capConfig = {
        appId: ctx.pkg.appId,
        appName: ctx.pkg.appName,
        backgroundColor: ctx.pkg.backgroundColor,
        bundledWebRuntime: false,
        npmClient: "yarn",
        webDir: "www",
        hideLogs: ctx.buildMode === 'production',
        android: {
            webContentsDebuggingEnabled: ctx.debug
        },
        plugins: {}
    }
    try {
        const plugins = JSON.parse(readFileSync(ctx.userCapacitorConfig, 'utf8')).plugins;
        if (plugins) {
            capConfig.plugins = plugins;
        }
    } catch {
    }
    writeFileSync(path.join(ctx.genDir, 'capacitor.config.json'), JSON.stringify(capConfig));
}

function writePubStub(dir: string) {
    console.info('make www stub');
    mkdirSync(dir);
    writeFileSync(path.join(dir, 'index.html'), '<html lang="en"></html>');
}

export function initAndroidProject(ctx: AndroidProjectContext) {

    writePkg(ctx);
    writeCapConfig(ctx);
    writePubStub(path.join(ctx.genDir, 'www'));

    console.log('cap add android');
    cap(['add', 'android'], ctx.genDir);
}