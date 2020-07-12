import {Particle} from "./Particle";
import {ArraySwap} from "../../ds/ArraySwap";
import {ComponentTypeA, Entity, Time} from "../..";

export class ParticleLayer_Data {
    readonly entity!: Entity;
    readonly particles = new ArraySwap<Particle>();
    cycled = false;
    keepAlive = false;
    timer = Time.ROOT;
}

export const ParticleLayer = new ComponentTypeA(ParticleLayer_Data);