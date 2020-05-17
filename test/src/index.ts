import {awaitDocument, Engine, loadBundle} from "@highduck/core";
import {startMain} from "./game/Game";
import {Plugins} from '@capacitor/core';

async function main() {
    await awaitDocument();

    Plugins.SplashScreen.hide().then();

    if (!Engine.restore()) {
        const engine = new Engine({
            width: 768,
            height: 1024
        });

        await loadBundle();
        startMain(engine);
        engine.start();
    }

    Engine.enableInspector();
}

main().then();
