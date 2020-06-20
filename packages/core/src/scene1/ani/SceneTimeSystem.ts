import {Entity} from "../../ecs/Entity";

export function updateSceneTimeNodes(entity: Entity, dt: number) {
    dt *= entity.timeScale;
    entity.dt = dt;
    entity.timeTotal += dt;
    let it = entity.childFirst;
    while (it !== undefined) {
        updateSceneTimeNodes(it, dt);
        it = it.siblingNext;
    }
}