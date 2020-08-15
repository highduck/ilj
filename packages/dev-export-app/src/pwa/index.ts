import {makeIconPWA} from "./images";
import {PWAProjectContext} from "./context";
import {createWebManifest} from "./pwaManifest";

export async function exportPWA(basedir?: string, target?: string, mode?: 'production' | 'development', debug?: boolean, deploy?: boolean) {
    const ctx = new PWAProjectContext({basedir, target, mode, debug});

    createWebManifest(ctx);
    await makeIconPWA(ctx.config.icon, ctx.inputDirPub);

    ctx.bundle();
    if (deploy) {
        ctx.deploy();
    }
}
