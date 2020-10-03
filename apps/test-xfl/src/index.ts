import {whenDocumentLoaded, Camera2D, Engine, Entity, loadBundle, Transform2D} from "@highduck/core";

function startGame() {
    const engine = Engine.current;
    const camera = Entity.root.create("main camera");
    camera.set(Transform2D);

    const cam = camera.set(Camera2D);
    cam.clearColorEnabled = true;
    const c = 0.8;
    cam.clearColor.set(c, c, c, 1);

    let sceneIndex = 0;
    let test = engine.aniFactory.createScene("test", sceneIndex);
    if (test) {
        test.name = "Flash Scene Test";
        Entity.root.append(test);
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
                Entity.root.append(test);
            }
        }
    });
}

async function main() {
    await whenDocumentLoaded();
    new Engine({
        width: 768,
        height: 1024
    });
    import('@highduck/live-inspector');
    await loadBundle('assets');
    startGame();
}

main().then();
