import {declTypeID} from "../../util/TypeID";
import {Entity} from "../../ecs/Entity";
import {Engine} from "../../Engine";

export class EntityAge {
    static TYPE_ID = declTypeID();
    readonly entity!: Entity;

    lifeRemaining = 0;
}

const LIST: Entity[] = [];

export function processEntityAge() {
    LIST.length = 0;
    for (const age of Engine.current.world.query(EntityAge)) {
        age.lifeRemaining -= age.entity.dt;
        if (age.lifeRemaining <= 0) {
            LIST[LIST.length] = age.entity;
        }
    }
    for (const e of LIST) {
        e.dispose();
    }
}