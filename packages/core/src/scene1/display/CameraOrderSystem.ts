import {Engine} from "../../Engine";
import {Camera2D} from "./Camera2D";

export class CameraOrderSystem {
    readonly cameras: Camera2D[] = [];

    constructor(readonly engine: Engine) {
    }

    process() {
        this.cameras.length = 0;
        for (const camera of this.engine.world.query(Camera2D)) {
            if (camera.enabled) {
                this.cameras.push(camera);
            }
        }
        this.cameras.sort((a, b) => a.order - b.order);
    }
}