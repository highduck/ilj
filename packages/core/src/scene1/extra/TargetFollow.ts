import {declTypeID} from "../../util/TypeID";
import {Camera2D} from "../display/Camera2D";
import {Entity} from "../../ecs/Entity";
import {Engine} from "../../Engine";
import {Transform2D} from "../display/Transform2D";

export class TargetFollow {
    static TYPE_ID = declTypeID();
    readonly entity!: Entity;
    target: undefined | Entity = undefined;

    // interactive
    cameraPointer?: Entity;
}

export function updateTargetFollow() {
    const engine = Engine.current;
    const components = engine.world.components(TargetFollow);
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