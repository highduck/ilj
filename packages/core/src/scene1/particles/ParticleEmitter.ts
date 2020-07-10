import {EmitterData, ParticleDecl} from "./ParticleDecl";
import {Entity} from "../../ecs/Entity";
import {Component, Time} from "../..";

export class ParticleEmitter extends Component() {
    data?: undefined | EmitterData = new EmitterData();
    layer?: Entity;
    time = 0;
    enabled = true;
    timer = Time.ROOT;

    get particleData(): ParticleDecl | undefined {
        return this.data?.particle?.data;
    }
}
