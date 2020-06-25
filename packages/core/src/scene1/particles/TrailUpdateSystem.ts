import {Engine} from "../../Engine";
import {Trail} from "./Trail";

export function updateTrails() {
    const trails = Engine.current.world.components(Trail);
    for (let i = 0; i < trails.length; ++i) {
        const trail = trails[i];
        if (trail.enabled) {
            trail.updateTrail();
        }
    }
}