import {Camera2D} from "./Camera2D";
import {Engine} from "../../Engine";
import {Matrix2D} from "@highduck/math";
import {getComponents} from "../../ecs/World";
import {TypeOfComponentData} from "../..";

export class CameraManager {
    readonly activeCameras: TypeOfComponentData<typeof Camera2D>[] = [];

    updateCameraStack() {
        const engine = Engine.current;
        const contentScale = engine.view.contentScale;
        const rc = engine.graphics.currentFramebufferRect;

        this.activeCameras.length = 0;
        const cameras = getComponents(Camera2D);
        for (let i = 0; i < cameras.length; ++i) {
            const camera = cameras[i];

            if (!camera.enabled) {
                continue;
            }

            if (camera.syncContentScale) {
                camera.contentScale = contentScale;
            }

            camera.screenRect.set(
                rc.x + rc.width * camera.viewport.x,
                rc.y + rc.height * camera.viewport.y,
                rc.width * camera.viewport.width,
                rc.height * camera.viewport.height,
            );

            camera.calcMatrix(1, camera.matrix);
            camera.worldRect.copyFrom(camera.screenRect).transform(camera.matrix);

            camera.calcMatrix(camera.debugDrawScale, camera.matrix);

            camera.inverseMatrix.copyFrom(camera.matrix);
            Matrix2D.inverse(camera.inverseMatrix);

            this.activeCameras.push(camera);
        }
        this.activeCameras.sort((a, b) => a.order - b.order);
    }
}