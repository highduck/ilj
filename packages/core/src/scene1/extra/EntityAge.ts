import {Entity} from "../../ecs/Entity";
import {Component} from "../../ecs/Component";
import {getComponents} from "../../ecs/World";
import {Time} from "../..";

export class EntityAge extends Component() {
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