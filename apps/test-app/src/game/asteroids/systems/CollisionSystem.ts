import {Asteroid, Bullet, Collision, Spaceship} from "../components";
import {GameFactory} from "../factory";
import {Vec2} from "@highduck/math";
import {Fsm} from "../fsm";
import {destroyEntity, ECS_query3, RndDefault, Transform2D} from "@highduck/core";

export class CollisionSystem {
    constructor(readonly factory: GameFactory) {

    }

    update() {
        const bullets = [...ECS_query3(Bullet, Transform2D, Collision).entities()];
        const asteroids = [...ECS_query3(Asteroid, Transform2D, Collision).entities()];
        const spaceships = [...ECS_query3(Spaceship, Transform2D, Collision).entities()];

        for (const bullet of bullets) {
            const bulletTransform = bullet.get(Transform2D);
            for (const asteroid of asteroids) {
                const asteroidTransform = asteroid.get(Transform2D);
                const asteroidCollision = asteroid.get(Collision);

                if (asteroidTransform.position.distance(bulletTransform.position) <= asteroidCollision.radius) {
                    destroyEntity(bullet.index);
                    if (asteroidCollision.radius > 10) {
                        for (let an = 0; an < 2; ++an) {
                            const p = new Vec2(RndDefault.range(-5, 5), RndDefault.range(-5, 5)).add(asteroidTransform.position);
                            const r = asteroidCollision.radius - 10;
                            this.factory.spawnAsteroid(r, p);
                        }
                    }
                    destroyEntity(asteroid.index);
                    break;
                }
            }
        }

        for (const spaceship of spaceships) {
            const spaceshipTransform = spaceship.get(Transform2D);
            const spaceshipCollision = spaceship.get(Collision);

            for (const asteroid of asteroids) {
                const asteroidTransform = asteroid.get(Transform2D);
                const asteroidCollision = asteroid.get(Collision);

                if (asteroidTransform.position.distance(spaceshipTransform.position) <=
                    asteroidCollision.radius + spaceshipCollision.radius) {
                    spaceship.get(Fsm).set("destroyed");
                    break;
                }
            }
        }

    }
}