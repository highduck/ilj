import {Motion} from "../components";
import {Vec2} from "@highduck/math";
import {Entity, Transform2D} from "@highduck/core";

export class MovementSystem {

    constructor(public readonly root: Entity) {
    }

    update() {
        const width = 768;
        const height = 1024;

        for (const [tr, motion] of this.root.world.query(Transform2D, Motion)) {
            const dt = tr.entity.dt;

            tr.position.addScale(motion.velocity, dt);

            if (tr.position.x < 0) {
                tr.position.x += width;
            }
            if (tr.position.x > width) {
                tr.position.x -= width;
            }
            if (tr.position.y < 0) {
                tr.position.y += height;
            }
            if (tr.position.y > height) {
                tr.position.y -= height;
            }
            tr.rotation += motion.angularVelocity * dt;
            if (motion.damping > 0) {
                const damp = new Vec2().direction(tr.rotation).scale(motion.damping * dt).abs();
                if (motion.velocity.x > damp.x) {
                    motion.velocity.x -= damp.x;
                } else if (motion.velocity.x < -damp.x) {
                    motion.velocity.x += damp.x;
                } else {
                    motion.velocity.x = 0.0;
                }
                if (motion.velocity.y > damp.y) {
                    motion.velocity.y -= damp.y;
                } else if (motion.velocity.y < -damp.y) {
                    motion.velocity.y += damp.y;
                } else {
                    motion.velocity.y = 0.0;
                }
            }
        }
    }
}