import {Particle} from "./Particle";
import {ArraySwap} from "../../ds/ArraySwap";
import {Component, Time} from "../..";

export class ParticleLayer extends Component() {
    readonly particles = new ArraySwap<Particle>();
    cycled = false;
    keepAlive = false;
    timer = Time.ROOT;
}