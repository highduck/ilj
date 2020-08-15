import {setupAndroidProject} from "./stage1_setup";
import {patchAndroidManifest} from "./stage2_androidManifest";
import {setupSigning} from "./stage3_setupSigning";
import {AndroidProjectContext} from "./context";
import {makeIconAndroid, makeSplashAndroid} from "./images";

export async function exportAndroid(basedir?: string, target?: string, mode?: 'production' | 'development', debug?: boolean, deploy?: boolean) {
    const ctx = new AndroidProjectContext({basedir, target, mode, debug});

    ctx.initializeCapacitorProject();

    setupAndroidProject(ctx);
    patchAndroidManifest(ctx);
    setupSigning(ctx);

    await Promise.all([
        makeSplashAndroid(ctx.config.splash, ctx.genProjectResPath),
        makeIconAndroid(ctx.config.icon, ctx.genProjectResPath)
    ]);

    ctx.bundle();

}
