import {Camera2D, Camera2DComponent} from "./Camera2D";
import {Engine} from "../../Engine";
import {Matrix2D} from "@highduck/math";
import {EntityMap, TypeOfComponent} from "../../ecs";

function cameraSortFunction(a: Camera2DComponent, b: Camera2DComponent) {
    return a.order - b.order;
}

export class CameraManager {
    readonly activeCameras: TypeOfComponent<typeof Camera2D>[] = [];

    updateCameraStack() {
        const engine = Engine.current;
        const contentScale = engine.view.contentScale;
        const rc = engine.graphics.currentFramebufferRect;

        this.activeCameras.length = 0;
        const cameras = Camera2D.map.values;
        const entities = Camera2D.map.keys;
        for (let i = 0; i < cameras.length; ++i) {
            const camera = cameras[i];
            if (!camera.enabled) {
                continue;
            }

            const entity = EntityMap.get(entities[i])!;
            if (camera.syncContentScale) {
                camera.contentScale = contentScale;
            }

            camera.screenRect.set(
                rc.x + rc.width * camera.viewport.x,
                rc.y + rc.height * camera.viewport.y,
                rc.width * camera.viewport.width,
                rc.height * camera.viewport.height,
            );

            camera.calcMatrix(entity, 1, camera.matrix);
            camera.worldRect.copyFrom(camera.screenRect).transform(camera.matrix);

            camera.calcMatrix(entity, camera.debugDrawScale, camera.matrix);

            camera.inverseMatrix.copyFrom(camera.matrix);
            Matrix2D.inverse(camera.inverseMatrix);

            this.activeCameras.push(camera);
        }
        this.activeCameras.sort(cameraSortFunction);
    }
}