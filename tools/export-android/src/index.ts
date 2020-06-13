import {AndroidProjectContext} from "./context";
import {initAndroidProject} from "./stage0_init";
import {setupAndroidProject} from "./stage1_setup";
import rimraf from "rimraf";
import {mkdirSync} from 'fs';
import {copyFolderRecursiveSync} from "./utils";
import {setupSigning} from "./stage3_setupSigning";
import {patchAndroidManifest} from "./stage2_androidManifest";

export function exportAndroid(basedir?: string) {
    const ctx = new AndroidProjectContext({
        basedir
    });

    rimraf.sync(ctx.tempDir);
    mkdirSync(ctx.tempDir, {recursive: true});

    initAndroidProject(ctx);
    setupAndroidProject(ctx);
    patchAndroidManifest(ctx);
    setupSigning(ctx);

    copyFolderRecursiveSync(ctx.inputDirPub, ctx.androidProjDirs.pub);
}