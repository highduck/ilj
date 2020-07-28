import {Camera2D} from "../display/Camera2D";
import {Engine} from "../../Engine";
import {Transform2D} from "../display/Transform2D";
import {ComponentTypeA, EntityComponentType, Entity, getComponents} from "../../ecs";

export class TargetFollow_Data {
    constructor(readonly entity: Entity) {
    }

    target: Entity | null = null;

    // interactive
    cameraPointer: Entity | null = null;

    dispose() {
    }
}

export const TargetFollow = new EntityComponentType(TargetFollow_Data);

export function updateTargetFollow() {
    const engine = Engine.current;
    const components = getComponents(TargetFollow);
    for (let i = 0; i < components.length; ++i) {
        const follow = components[i];
        const pos = follow.entity.tryGet(Transform2D);
        if (pos !== undefined && follow.cameraPointer !== null) {
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