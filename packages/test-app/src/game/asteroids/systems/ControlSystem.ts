import {Gun, GunControls, Motion, MotionControl} from "../components";
import {Engine, Transform2D} from "@highduck/core";
import {Vec2} from "@highduck/math";
import {GameFactory} from "../factory";

export class ControlSystem {

    factory = this.engine.resolve(GameFactory);

    constructor(readonly engine: Engine) {

    }

    update() {
        const world = this.engine.world;
        const root = this.factory.root;
        const input = this.engine.input;

        // do not lock `position_t`
        for (const [control, gun, position] of world.query3(GunControls, Gun, Transform2D)) {
            gun.shooting = input.isKeyPressed(control.trigger);
            gun.timeSinceLastShot += position.entity.dt;
            if (gun.shooting && gun.timeSinceLastShot >= gun.minimumShotInterval) {
                this.factory.spawnUserBullet(gun, position);
                gun.timeSinceLastShot = 0.0;
            }
        }

        for (const [control, motion, position] of world.query3(MotionControl, Motion, Transform2D)) {
            const dt = position.entity.dt;

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