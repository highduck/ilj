import {Particle} from "./Particle";
import {getTypeID} from "../../util/TypeID";
import {Entity} from "../../ecs/Entity";

export class ParticleLayer {
    static TYPE_ID: number = getTypeID(ParticleLayer);
    readonly entity!: Entity;

    particles: Particle[] = [];
    cycled = false;
    keepAlive = false;
}