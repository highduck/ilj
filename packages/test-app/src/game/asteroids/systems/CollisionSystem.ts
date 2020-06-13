import {Asteroid, Bullet, Collision, Spaceship} from "../components";
import {GameFactory} from "../factory";
import {RndDefault, Vec2} from "@highduck/math";
import {Fsm} from "../fsm";
import {Engine, EntityAge, Transform2D} from "@highduck/core";

export class CollisionSystem {
    constructor(readonly factory: GameFactory) {

    }

    update() {
        const world = Engine.current.world;

        const bullets = [...world.query(Bullet, Transform2D, Collision).entities()];
        const asteroids = [...world.query(Asteroid, Transform2D, Collision).entities()];
        const spaceships = [...world.query(Spaceship, Transform2D, Collision).entities()];

        for (const bullet of bullets) {
            const bulletTransform = bullet.get(Transform2D);
            for (const asteroid of asteroids) {
                const asteroidTransform = asteroid.get(Transform2D);
                const asteroidCollision = asteroid.get(Collision);

                if (asteroidTransform.position.distance(bulletTransform.position) <= asteroidCollision.radius) {
                    bullet.set(EntityAge);//dispose();
                    if (asteroidCollision.radius > 10) {
                        for (let an = 0; an < 2; ++an) {
                            const p = new Vec2(RndDefault.range(-5, 5), RndDefault.range(-5, 5)).add(asteroidTransform.position);
                            const r = asteroidCollision.radius - 10;
                            this.factory.spawnAsteroid(r, p);
                        }
                    }
                    asteroid.set(EntityAge);
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