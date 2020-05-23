import {Vec2} from "@highduck/math";
import {declTypeID} from "@highduck/core";

export class Animation {
    static TYPE_ID = declTypeID();

    // interface link
    // animate(float dt);
}

export class Asteroid {
    static TYPE_ID = declTypeID();
}

export class Bullet {
    static TYPE_ID = declTypeID();
}

export class Collision {
    static TYPE_ID = declTypeID();

    radius: number = 0.0;
}

export class GameState {
    static TYPE_ID = declTypeID();

    lives = 3;
    level = 0;
    points = 0;
}

export class Gun {
    static TYPE_ID = declTypeID();

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

export class GunControls {
    static TYPE_ID = declTypeID();

    trigger = "Space";
}

export class Motion {
    static TYPE_ID = declTypeID();

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

export class MotionControl {
    static TYPE_ID = declTypeID();

    left = "ArrowLeft";
    right = "ArrowRight";
    accelerate = "ArrowUp";
    accelerationRate = 0.0;
    rotationRate = 0.0;
}

export class Spaceship {
    static TYPE_ID = declTypeID();
}
