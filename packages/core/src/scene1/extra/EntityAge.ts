import {declTypeID} from "../../util/TypeID";
import {Entity} from "../../ecs/Entity";
import {Time} from "../..";
import {getComponents} from "../../ecs/World";

export class EntityAge {
    static TYPE_ID = declTypeID();
    readonly entity!: Entity;

    lifeRemaining = 0;
}

const toDispose: Entity[] = [];

export function processEntityAge() {
    toDispose.length = 0;
    const dt = Time.ROOT.dt;
    const ages = getComponents(EntityAge);
    for (let i = 0; i < ages.length; ++i) {
        const age = ages[i];
        age.lifeRemaining -= dt;
        if (age.lifeRemaining <= 0) {
            toDispose[toDispose.length] = age.entity;
        }
    }
    for (let i = 0; i < toDispose.length; ++i) {
        toDispose[i].dispose();
    }
}