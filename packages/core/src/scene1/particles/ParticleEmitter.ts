import {EmitterData, ParticleDecl} from "./ParticleDecl";
import {Entity} from "../../ecs/Entity";
import {ComponentTypeA, Time} from "../..";

export class ParticleEmitter_Data {
    readonly entity!: Entity;

    data?: undefined | EmitterData = new EmitterData();
    layer?: Entity;
    time = 0;
    enabled = true;
    timer = Time.ROOT;

    get particleData(): ParticleDecl | undefined {
        return this.data?.particle?.data;
    }
}

export const ParticleEmitter = new ComponentTypeA(ParticleEmitter_Data);
