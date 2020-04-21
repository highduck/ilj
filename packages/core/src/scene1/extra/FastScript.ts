import {declTypeID} from "../../util/TypeID";
import {Entity} from "../../ecs/Entity";
import {Signal} from "../../util/Signal";
import {Engine} from "../../Engine";

export class FastScript {
    static TYPE_ID = declTypeID();
    readonly entity!: Entity;

    readonly updated = new Signal<Entity>();
}

export function updateFastScripts() {
    for (const script of Engine.current.world.query(FastScript)) {
        script.updated.emit(script.entity);
    }
}