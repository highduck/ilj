import {EntityMap, ComponentTypeA} from "../../ecs";
import {Time} from "../../app/Time";

export const EntityAge = new ComponentTypeA(class {
    lifeRemaining = 0;
});

const toDispose: number[] = [];

export function processEntityAge() {
    toDispose.length = 0;
    const dt = Time.ROOT.dt;
    const comps = EntityAge.map.values;
    const entities = EntityAge.map.keys;
    for (let i = 0; i < comps.length; ++i) {
        const age = comps[i];
        age.lifeRemaining -= dt;
        if (age.lifeRemaining <= 0) {
            toDispose[toDispose.length] = entities[i];
        }
    }
    for (let i = 0; i < toDispose.length; ++i) {
        EntityMap.get(toDispose[i])!.dispose();
    }
}