import {Engine} from "../../Engine";
import {Trail} from "./Trail";

export class TrailUpdateSystem {
    constructor(readonly engine: Engine) {
    }

    process() {
        for (const trail of this.engine.world.query(Trail)) {
            if(trail.enabled) {
                trail.update(trail.entity.dt);
            }
        }
    }
}