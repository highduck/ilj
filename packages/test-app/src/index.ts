import {awaitDocument, Engine, loadBundle} from "@highduck/core";
import {startMain} from "./game/Game";
import {Plugins} from '@capacitor/core';

async function main() {
    Plugins.SplashScreen.hide().then();

    await Engine.init({
        width: 768,
        height: 1024
    });

    await loadBundle();
    startMain();
}

main().then();
