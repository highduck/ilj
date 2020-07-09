import {Particle} from "./Particle";
import {declTypeID} from "../../util/TypeID";
import {Entity} from "../../ecs/Entity";
import {ArraySwap} from "../../ds/ArraySwap";
import {Component, Time} from "../..";

export class ParticleLayer {
    static TYPE_ID: number = declTypeID(ParticleLayer);
    readonly entity!: Entity;

    readonly particles = new ArraySwap<Particle>();
    cycled = false;
    keepAlive = false;

    timer = Time.ROOT;
}
//
// export class ParticleLayer extends Component() {
//     readonly particles = new ArraySwap<Particle>();
//     cycled = false;
//     keepAlive = false;
//
//     timer = Time.ROOT;
// }