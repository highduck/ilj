import {Trail} from "./Trail";
import {getComponents} from "../../ecs";

export function updateTrails() {
    const trails = getComponents(Trail);
    for (let i = 0; i < trails.length; ++i) {
        const trail = trails[i];
        trail.updateTrail();
        trail.updateMesh();
    }
}