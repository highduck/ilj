import {EmitterData, ParticleDecl} from "./ParticleDecl";
import {Entity} from "../../ecs/Entity";
import {ComponentTypeA, EntityComponentType, Time} from "../..";

export class ParticleEmitter_Data {
    constructor(readonly entity: Entity) {
    }

    data = new EmitterData();
    layer: Entity | null = null;
    time = 0;
    enabled = true;
    timer = Time.ROOT;

    get particleData(): ParticleDecl | null {
        return this.data.particle.data;
    }

    dispose() {}
}

export const ParticleEmitter = new EntityComponentType(ParticleEmitter_Data);
