import {declTypeID} from "../../util/TypeID";
import {Entity} from "../../ecs/Entity";
import {Signal} from "../../util/Signal";
import {Engine} from "../../Engine";
import {getComponents} from "../../ecs/World";

export class FastScript {
    static TYPE_ID = declTypeID();
    readonly entity!: Entity;

    readonly updated = new Signal<Entity>();
}

export function updateFastScripts() {
    const scripts = getComponents(FastScript);
    for (let i = 0; i < scripts.length; ++i) {
        const script = scripts[i];
        script.updated.emit(script.entity);
    }
}