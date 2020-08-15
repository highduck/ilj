import {awaitDocument, Engine, loadBundle} from "@highduck/core";
import {startMain} from "./game/Game";
import {Plugins} from '@capacitor/core';

async function main() {
    Plugins.SplashScreen.hide().then();

    await awaitDocument();
    new Engine({
        width: 768,
        height: 1024
    });

    await loadBundle('assets');
    startMain();
}

main().then();
