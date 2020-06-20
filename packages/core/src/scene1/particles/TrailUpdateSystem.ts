import {Engine} from "../../Engine";
import {Trail} from "./Trail";

export class TrailUpdateSystem {
    constructor(readonly engine: Engine) {
    }

    process() {
        const trails = this.engine.world.components(Trail);
        for (let i = 0; i < trails.length; ++i) {
            const trail = trails[i];
            if (trail.enabled) {
                trail.update(trail.entity.dt);
            }
        }
    }
}