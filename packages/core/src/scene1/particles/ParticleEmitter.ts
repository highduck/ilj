import {EmitterData, ParticleDecl} from "./ParticleDecl";
import {declTypeID} from "../../util/TypeID";
import {Entity} from "../../ecs/Entity";

export class ParticleEmitter {
    static TYPE_ID = declTypeID();
    readonly entity!: Entity;

    data?: undefined | EmitterData = new EmitterData();
    layer?: Entity;
    time = 0;
    enabled = true;

    get particleData(): ParticleDecl | undefined {
        return this.data?.particle?.data;
    }
}
