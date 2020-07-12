import {Gun, GunControls, Motion, MotionControl} from "../components";
import {ECS_query3, Engine, Time, Transform2D} from "@highduck/core";
import {Vec2} from "@highduck/math";
import {GameFactory} from "../factory";
import {resolve} from "../../../../../core/src/util/Services";

export class ControlSystem {

    factory = resolve(GameFactory);

    constructor(readonly engine: Engine) {

    }

    update() {
        const input = this.engine.input;
        const dt = Time.GAME.dt;

        // do not lock `position_t`
        for (const [control, gun, position] of ECS_query3(GunControls, Gun, Transform2D)) {
            gun.shooting = input.isKeyPressed(control.trigger);
            gun.timeSinceLastShot += dt;
            if (gun.shooting && gun.timeSinceLastShot >= gun.minimumShotInterval) {
                this.factory.spawnUserBullet(gun, position);
                gun.timeSinceLastShot = 0.0;
            }
        }

        for (const [control, motion, position] of ECS_query3(MotionControl, Motion, Transform2D)) {

            const left = input.isKeyPressed(control.left);
            const right = input.isKeyPressed(control.right);
            const accelerate = input.isKeyPressed(control.accelerate);

            if (left) {
                position.rotation -= control.rotationRate * dt;
            }

            if (right) {
                position.rotation += control.rotationRate * dt;
            }

            if (accelerate) {
                motion.velocity.addScale(new Vec2().direction(position.rotation), control.accelerationRate * dt);
            }
        }
    }
}