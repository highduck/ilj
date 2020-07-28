import {EntityMap} from "../../ecs";

let destroyCount = 0;
const destroyList: number[] = [0];
for (let i = 0; i < 100; ++i) {
    destroyList.push(0);
}

export function destroyEntity(entityIndex: number) {
    destroyList[destroyCount++] = entityIndex;
}

export function destroyEntities() {
    for (let i = 0; i < destroyCount; ++i) {
        const e = destroyList[i];
        if (EntityMap.has(e)) {
            EntityMap.unsafe_get(e).dispose();
        }
    }
    destroyCount = 0;
}