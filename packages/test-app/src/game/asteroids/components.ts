import {Vec2} from "@highduck/math";
import {ComponentTypeA, createTagComponent} from "@highduck/core";

export const Animation = createTagComponent();
// interface link
// animate(float dt);

export const Asteroid = createTagComponent();

export const Bullet = createTagComponent();

export const Spaceship = createTagComponent();

export class CollisionData {
    radius: number = 0.0;
}

export const Collision = new ComponentTypeA(CollisionData);

export class GameStateData {
    lives = 3;
    level = 0;
    points = 0;
}

export const GameState = new ComponentTypeA(GameStateData);

export class GunData {
    shooting = false;
    readonly offsetFromParent = new Vec2();
    timeSinceLastShot = 0.0;
    minimumShotInterval = 0.0;
    bulletLifetime = 0.0;
    velocity = 800;
    spreadAngle = 0.0;

    setup(offset: Vec2,
          minimumShotInterval: number,
          bulletLifetime: number,
          spreadAngle: number): this {
        this.offsetFromParent.copyFrom(offset);
        this.minimumShotInterval = minimumShotInterval;
        this.bulletLifetime = bulletLifetime;
        this.spreadAngle = spreadAngle;
        return this;
    }
}

export const Gun = new ComponentTypeA(GunData);

export class GunControlsData {
    trigger = "Space";
}

export const GunControls = new ComponentTypeA(GunControlsData);

export class MotionData {
    readonly velocity = new Vec2();
    angularVelocity = 0.0;
    damping = 0.0;

    setup(velocity: Vec2, angular_velocity: number, damping: number): this {
        this.velocity.copyFrom(velocity);
        this.angularVelocity = angular_velocity;
        this.damping = damping;
        return this;
    }
}

export const Motion = new ComponentTypeA(MotionData);

export class MotionControlData {
    left = "ArrowLeft";
    right = "ArrowRight";
    accelerate = "ArrowUp";
    accelerationRate = 0.0;
    rotationRate = 0.0;
}

export const MotionControl = new ComponentTypeA(MotionControlData);