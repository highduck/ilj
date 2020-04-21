import {declTypeID} from "../../util/TypeID";
import {Camera2D} from "../display/Camera2D";
import {Entity} from "../../ecs/Entity";
import {Engine} from "../../Engine";
import {Transform2D} from "../display/Transform2D";

export class TargetFollow {
    static TYPE_ID = declTypeID();

    target: undefined | Entity = undefined;

    // interactive
    cameraPointer?: Entity;
}

export const TargetFollowUpdate = (engine: Engine) => {
    for (const [pos, follow] of engine.world.query(Transform2D, TargetFollow)) {
        if (follow.cameraPointer !== undefined) {
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
};