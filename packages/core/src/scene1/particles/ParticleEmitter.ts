import {EmitterData, ParticleDecl} from "./ParticleDecl";
import {Entity} from "../../ecs/Entity";
import {ComponentTypeA, EntityComponentType, Time} from "../..";

export class ParticleEmitter_Data {
    constructor(readonly entity: Entity) {
    }

    data?: undefined | EmitterData = new EmitterData();
    layer?: Entity;
    time = 0;
    enabled = true;
    timer = Time.ROOT;

    get particleData(): ParticleDecl | undefined {
        return this.data?.particle?.data;
    }
}

export const ParticleEmitter = new EntityComponentType(ParticleEmitter_Data);
