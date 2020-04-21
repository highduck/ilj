import {Engine} from "../../Engine";
import {Entity} from "../../ecs/Entity";

const update = (entity: Entity, dt: number) => {
    dt *= entity.timeScale;
    entity.dt = dt;
    entity.timeTotal += dt;
    let it = entity.childFirst;
    while (it !== undefined) {
        update(it, dt);
        it = it.siblingNext;
    }
};

export const SceneTimeSystem = (engine: Engine) =>
    update(engine.root, engine.time.delta);