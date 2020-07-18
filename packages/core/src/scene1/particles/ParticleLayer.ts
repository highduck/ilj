import {Particle} from "./Particle";
import {ArraySwap} from "../../ds/ArraySwap";
import {EntityComponentType, Entity} from "../../ecs";
import {Time} from "../../app/Time";

export class ParticleLayer_Data {
    constructor(readonly entity: Entity) {
    }

    readonly particles = new ArraySwap<Particle>();
    cycled = false;
    keepAlive = false;
    timer = Time.ROOT;
}

export const ParticleLayer = new EntityComponentType(ParticleLayer_Data);