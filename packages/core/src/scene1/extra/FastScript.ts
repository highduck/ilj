import {Entity} from "../../ecs/Entity";
import {Signal} from "../../util/Signal";
import {EntityMap, ComponentTypeA} from "../../ecs";

export const FastScript = new ComponentTypeA(class {
    readonly updated = new Signal<Entity>();
});

export function updateFastScripts() {
    const components = FastScript.map.values;
    const ids = FastScript.map.keys;

    for (let i = 0; i < components.length; ++i) {
        components[i].updated.emit(EntityMap.get(ids[i])!);
    }
}