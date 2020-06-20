import {AndroidProjectContext} from "./context";
import {initAndroidProject} from "./stage0_init";
import {setupAndroidProject} from "./stage1_setup";
import rimraf from "rimraf";
import {mkdirSync, renameSync} from 'fs';
import {copyFolderRecursiveSync} from "./utils";
import {setupSigning} from "./stage3_setupSigning";
import {patchAndroidManifest} from "./stage2_androidManifest";

export function exportAndroid(basedir?: string, target?: string, mode?: 'production' | 'development', debug?: boolean) {
    const ctx = new AndroidProjectContext({basedir, target, mode, debug});

    rimraf.sync(ctx.genDir);
    mkdirSync(ctx.genDir, {recursive: true});

    initAndroidProject(ctx);
    setupAndroidProject(ctx);
    patchAndroidManifest(ctx);
    setupSigning(ctx);

    copyFolderRecursiveSync(ctx.inputDirPub, ctx.genProjDirs.pub);

    console.log('delete old android project');
    rimraf.sync(ctx.outputProjDir);

    try {
        mkdirSync(ctx.dir, {recursive: true});
    } catch {
    }

    console.log('move new android project');
    renameSync(ctx.genProjDir, ctx.outputProjDir);
}