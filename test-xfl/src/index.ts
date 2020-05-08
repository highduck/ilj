import {awaitDocument, Camera2D, Engine, loadBundle, Transform2D} from "@highduck/core";
import {Plugins} from '@capacitor/core';

function startGame() {
    const engine = Engine.current;
    const camera = engine.root.create("main camera");
    camera.set(Transform2D);

    const cam = camera.set(Camera2D);
    cam.clearColorEnabled = true;
    const c = 0.8;
    cam.clearColor.set(c, c, c, 1);

    let sceneIndex = 0;
    let test = engine.aniFactory.createScene("test", sceneIndex);
    if (test) {
        test.name = "Flash Scene Test";
        engine.root.append(test);
    }


    engine.onUpdate.on(() => {
        if (engine.input.isPointerDown) {
            if (test) {
                test.dispose();
            }
            ++sceneIndex;
            test = engine.aniFactory.createScene("test", sceneIndex);
            if (test) {
                test.name = "Flash Scene Test";
                engine.root.append(test);
            }
        }
    });
}

async function main() {
    await awaitDocument();

    if (!Engine.restore()) {
        const engine = new Engine({
            width: 768,
            height: 1024
        });

        await loadBundle();
        startGame();
        engine.start();
    }

    if (process.env.NODE_ENV === 'development') {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('dev')) {
            const {DevApp} = require("@highduck/live-inspector");
            const engine = Engine.current;
            try {
                DevApp.CURRENT = engine.resolve(DevApp);
                DevApp.init();
            } catch {
                engine.register(new DevApp(engine));
            }

            Plugins.Device.getInfo().then((info) => {
                console.log(info);
            });
        }
    }
}

main().then();
