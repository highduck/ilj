import {Camera2D, Engine, loadBundle, Transform2D} from "@highduck/core";

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
    await Engine.init({
        width: 768,
        height: 1024
    });
    await loadBundle();
    startGame();
}

main().then();
