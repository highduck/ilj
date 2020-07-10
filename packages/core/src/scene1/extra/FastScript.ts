import {Entity} from "../../ecs/Entity";
import {Signal} from "../../util/Signal";
import {getComponents} from "../../ecs/World";
import {Component} from "../..";

export class FastScript extends Component() {
    readonly updated = new Signal<Entity>();
}

export function updateFastScripts() {
    const scripts = getComponents(FastScript);
    for (let i = 0; i < scripts.length; ++i) {
        const script = scripts[i];
        script.updated.emit(script.entity);
    }
}