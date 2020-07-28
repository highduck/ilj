import {Signal} from "../../util/Signal";
import {ComponentTypeA, Entity, EntityMap} from "../../ecs";

class FastScriptData {
    readonly updated = new Signal<Entity>();
}

export const FastScript = new ComponentTypeA(FastScriptData);

export function updateFastScripts() {
    const components = FastScript.map.values;
    const ids = FastScript.map.keys;

    for (let i = 0; i < components.length; ++i) {
        components[i].updated.emit(EntityMap.get(ids[i])!);
    }
}