import {Particle} from "./Particle";
import {declTypeID} from "../../util/TypeID";
import {Entity} from "../../ecs/Entity";
import {ArraySwap} from "../../util/ArraySwap";
import {Time} from "../..";

export class ParticleLayer {
    static TYPE_ID: number = declTypeID(ParticleLayer);
    readonly entity!: Entity;

    readonly particles = new ArraySwap<Particle>();
    cycled = false;
    keepAlive = false;

    timer = Time.ROOT;
}