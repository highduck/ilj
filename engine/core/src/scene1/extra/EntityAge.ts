import {ComponentTypeA} from "../../ecs";
import {Time} from "../../app/Time";
import {destroyEntity} from "./EntityDestroyer";

export class EntityAgeData {
    lifeRemaining = 0.0;
}

export const EntityAge = new ComponentTypeA(EntityAgeData);

export function processEntityAge() {
    const dt = Time.ROOT.dt;
    const comps = EntityAge.map.values;
    const entities = EntityAge.map.keys;
    for (let i = 0; i < comps.length; ++i) {
        const age = comps[i];
        age.lifeRemaining -= dt;
        if (age.lifeRemaining <= 0.0) {
            destroyEntity(entities[i]);
        }
    }
}