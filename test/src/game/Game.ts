import {Atlas, Camera2D, Engine, Font, loadBundle, Resources, Transform2D} from "@highduck/core";
import {TestAni} from "./scene/TestAni";
import {Entities} from "./scene/Entities";
import {TrailDemo} from "./scene/TrailTest";
import {Rect} from "@highduck/math";
import {SweepDemo} from "./drawer/SweepDemo";
import {Asteroids} from "./asteroids/Asteroids";
import {DrawerDemo} from "./drawer/DrawerDemo";
import {EasingDemo} from "./drawer/EasingDemo";

const localStats = {
    quadsToDraw: 2000
};

export function startMain(engine: Engine) {
    const camera = engine.root.create();
    camera.set(Camera2D);
    camera.set(Transform2D);
    camera.name = "MainCamera";

    const drawerDemo = new DrawerDemo();
    const easingDemo = new EasingDemo();
    const test_ani = new TestAni();
    let entities_test = new Entities();
    if (module.hot) {
        module.hot.accept('./scene/Entities', function () {
            entities_test = new Entities();
        });
    }

    const sweepDemo = new SweepDemo();
    const trailTest = new TrailDemo();
    const mousePosition = new Rect();
    let mouse_push = false;
    engine.input.onMouse.on((e) => {
        mousePosition.x = e.x;
        mousePosition.y = e.y;
        if (e.button == 0) {
            switch (e.type) {
                case "mousedown":
                    mouse_push = true;
                    break;
                case "mouseup":
                    mouse_push = false;
                    break;
                default:
                    break;
            }
        }
    });

    engine.view.onResize.on(() => {
        console.info("GameView Resize event");
    });

    engine.input.onKeyboard.on((e) => {
        console.info(e);
    });

    engine.onUpdate.on(() => {
        const time = engine.time.total;
        camera.get(Camera2D).clearColor.set(
            0.2 + 0.1 * Math.sin(time),
            0.2 + 0.1 * Math.cos(time),
            0.2 + 0.1 * Math.sin(4.0 * time),
            1
        );
        drawerDemo.draw(localStats.quadsToDraw);

        entities_test.update();
        easingDemo.draw();
    });

    const asteroids = new Asteroids();
    engine.onUpdate.on(() => asteroids.update());

    engine.variables.push(localStats);
}