import {declTypeID, Engine, Entity, Time, Transform2D} from "..";
import {integrateExp, lerp, reach, Vec2} from "@highduck/math";
import {getComponents} from "../ecs/World";

export class CameraShaker {
    static TYPE_ID = declTypeID();
    readonly entity!: Entity;

    state = 0;
    maxRotation = 0.25;
    readonly maxOffset = new Vec2(8, 8);
    readonly maxScale = new Vec2(0.25, 0.25);
    timer = Time.GAME;

    start(v: number = 1) {
        this.state = Math.max(v, this.state);
    }
}

const TEMP_VEC2 = new Vec2();

export function updateCameraShakers() {
    const shakers = getComponents(CameraShaker);
    for (let i = 0; i < shakers.length; ++i) {
        const shaker = shakers[i];
        const pos = shaker.entity.get(Transform2D);
        const dt = shaker.timer.dt;
        shaker.state = reach(shaker.state, 0, dt);
        const r = integrateExp(0.9, dt);
        pos.rotation = lerp(pos.rotation, (Math.random() - 0.5) * shaker.maxRotation * shaker.state, r);
        TEMP_VEC2.set(
            1.0 + (Math.random() - 0.5) * shaker.maxScale.x * shaker.state,
            1.0 + (Math.random() - 0.5) * shaker.maxScale.y * shaker.state
        );
        pos.scale.lerp(TEMP_VEC2, r);
        TEMP_VEC2.set(
            Math.random() * shaker.maxOffset.x * shaker.state,
            Math.random() * shaker.maxOffset.y * shaker.state
        );
        pos.position.lerp(TEMP_VEC2, r);
    }
}