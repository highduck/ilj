import {copyFileSync, existsSync, mkdirSync, writeFileSync, readFileSync, renameSync} from "fs";
import path from "path";
import {cap, copyFolderRecursiveSync} from "./utils";
import rimraf from "rimraf";
import {AndroidProjectContext} from "./context";

function writePkg(ctx: AndroidProjectContext) {
    const pkgPath = path.join(ctx.tempDir, 'package.json');

    const dependencies: { [key: string]: string } = {};
    for (const id of ctx.capacitorPlugins) {
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
        appId: ctx.appId,
        appName: ctx.appName,
        backgroundColor: ctx.backgroundColor,
        bundledWebRuntime: false,
        npmClient: "yarn",
        webDir: "www",
        hideLogs: ctx.commonConfig.mode === 'production',
        android: {
            webContentsDebuggingEnabled: ctx.commonConfig.mode !== 'production'
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
    writeFileSync(path.join(ctx.tempDir, 'capacitor.config.json'), JSON.stringify(capConfig));
}

function writePubStub(dir: string) {
    console.info('make www stub');
    mkdirSync(dir);
    writeFileSync(path.join(dir, 'index.html'), '<html lang="en"></html>');

}

export function initAndroidProject(ctx: AndroidProjectContext) {

    writePkg(ctx);
    writeCapConfig(ctx);
    writePubStub(path.join(ctx.tempDir, 'www'));

    console.log('cap add android');
    cap(['add', 'android'], ctx.tempDir);

    console.log('delete old android project');
    rimraf.sync(ctx.androidProjDir);

    console.log('move new android project');
    renameSync(path.join(ctx.tempDir, 'android'), path.join(ctx.androidProjDir));
    //
    // copyFolderRecursiveSync(path.join(ctx.tempDir, 'android'),
    //     path.join(ctx.androidProjDir));
}