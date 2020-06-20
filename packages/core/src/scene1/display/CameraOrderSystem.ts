import {Engine} from "../../Engine";
import {Camera2D} from "./Camera2D";

export class CameraOrderSystem {
    readonly cameras: Camera2D[] = [];

    constructor(readonly engine: Engine) {
    }

    process() {
        this.cameras.length = 0;
        const cameras = this.engine.world.components(Camera2D);
        for (let i = 0; i < cameras.length; ++i) {
            const camera = cameras[i];
            if (camera.enabled) {
                this.cameras.push(camera);
            }
        }
        this.cameras.sort((a, b) => a.order - b.order);
    }
}