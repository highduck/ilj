import {Camera2D} from "../display/Camera2D";
import {Entity} from "../../ecs/Entity";
import {Engine} from "../../Engine";
import {Transform2D} from "../display/Transform2D";
import {getComponents} from "../../ecs/World";
import {ComponentTypeA} from "../..";

export class TargetFollow_Data {
    readonly entity!: Entity;

    target: Entity | undefined = undefined;

    // interactive
    cameraPointer: Entity | undefined = undefined;
}

export const TargetFollow = new ComponentTypeA(TargetFollow_Data);

export function updateTargetFollow() {
    const engine = Engine.current;
    const components = getComponents(TargetFollow);
    for (let i = 0; i < components.length; ++i) {
        const follow = components[i];
        const pos = follow.entity.tryGet(Transform2D);
        if (pos !== undefined && follow.cameraPointer !== undefined) {
            const camera = follow.cameraPointer.tryGet(Camera2D);
            if (camera !== undefined) {
                const mouse = engine.interactiveManager.pointerScreenSpace;
                camera.matrix.transform(mouse.x, mouse.y, pos.position);
            }
        }
        // TODO: target follow
        //const follow = e.get(TargetFollow);
        // Transform2D.globalToParent(pos.entity, mouse, pos.position);
    }
}