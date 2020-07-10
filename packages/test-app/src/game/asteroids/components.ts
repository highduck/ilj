import {Vec2} from "@highduck/math";
import {Component} from "@highduck/core";

export class Animation extends Component() {
    // interface link
    // animate(float dt);
}

export class Asteroid extends Component() {
}

export class Bullet extends Component() {
}

export class Collision extends Component() {
    radius: number = 0.0;
}

export class GameState extends Component() {
    lives = 3;
    level = 0;
    points = 0;
}

export class Gun extends Component() {
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

export class GunControls extends Component() {
    trigger = "Space";
}

export class Motion extends Component() {
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

export class MotionControl extends Component() {
    left = "ArrowLeft";
    right = "ArrowRight";
    accelerate = "ArrowUp";
    accelerationRate = 0.0;
    rotationRate = 0.0;
}

export class Spaceship extends Component() {
}
