import {setupAndroidProject} from "./stage1_setup";
import {patchAndroidManifest} from "./stage2_androidManifest";
import {setupSigning} from "./stage3_setupSigning";
import {AndroidProjectContext} from "./context";
import {makeAdaptiveIconAndroid, makeIconAndroid, makeSplashAndroid} from "./images";

export async function exportAndroid(basedir?: string, target?: string, mode?: 'production' | 'development', debug?: boolean, deploy?: boolean) {
    const ctx = new AndroidProjectContext({basedir, target, mode, debug});

    ctx.initializeCapacitorProject();

    setupAndroidProject(ctx);
    patchAndroidManifest(ctx);
    setupSigning(ctx);

    const tasks:Promise<any>[] = [
        makeSplashAndroid(ctx.config.splash, ctx.genProjectResPath),
        makeIconAndroid(ctx.config.icon, ctx.genProjectResPath)
    ];
    if(ctx.config.adaptiveIcon) {
        tasks.push(makeAdaptiveIconAndroid(ctx.config.adaptiveIcon, ctx.genProjectResPath));
    }
    await Promise.all(tasks);

    ctx.bundle();

}
