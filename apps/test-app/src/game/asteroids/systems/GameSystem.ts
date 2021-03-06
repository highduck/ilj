import {ECS_query2, ECS_query3, Entity, getComponents, RndDefault, Transform2D} from "@highduck/core";
import {Asteroid, Bullet, Collision, GameState, Spaceship} from "../components";
import {Vec2} from "@highduck/math";
import {GameFactory} from "../factory";

const gameSize = new Vec2(768, 1024);

export class GameSystem {

    constructor(public readonly factory: GameFactory) {

    }

    update() {
        const root = this.factory.root;

        let spaceship: Entity | undefined;
        let hasAsteroids = false;
        let hasBullets = false;
        for (const _ of ECS_query2(Bullet, Collision).entities()) {
            hasBullets = true;
            break;
        }
        for (const _ of ECS_query2(Collision, Asteroid).entities()) {
            hasAsteroids = true;
            break;
        }
        for (const _ of ECS_query2(Collision, Spaceship).entities()) {
            spaceship = _;
            break;
        }

        let gameStatesCount = 0;

        const gameStates = getComponents(GameState);
        for (let i = 0; i < gameStates.length; ++i) {
            const gameState = gameStates[i];
            if (!spaceship) {
                if (gameState.lives > 0) {
                    const newSpaceshipPosition = gameSize.copy().scale(0.5);
                    let clearToAddSpaceship = true;

                    for (const [_, asteroidTransform, asteroidCollision] of ECS_query3(Asteroid, Transform2D, Collision)) {
                        if (asteroidTransform.position.distance(newSpaceshipPosition) <=
                            asteroidCollision.radius + 50) {
                            clearToAddSpaceship = false;
                            break;
                        }
                    }

                    if (clearToAddSpaceship) {
                        this.factory.spawnSpaceship();
                        --gameState.lives;
                    }
                } else {
                    // game over
                }
            }

            if (!hasAsteroids && !hasBullets && spaceship) {
                // next level
                const spaceshipTransform = spaceship.get(Transform2D);
                ++gameState.level;
                const asteroidCount = 2 + gameState.level;
                let asteroidPosition = new Vec2();
                for (let i = 0; i < asteroidCount; ++i) {
                    // check not on top of spaceship
                    let iterations = 20;
                    do {
                        asteroidPosition.x = RndDefault.range(0, gameSize.x);
                        asteroidPosition.y = RndDefault.range(0, gameSize.y);
                    } while (spaceshipTransform.position.distance(asteroidPosition) <= 80 && iterations-- > 0);
                    this.factory.spawnAsteroid(30, asteroidPosition);
                }
            }

            if (spaceship) {
                const rt = root.getOrCreate(Transform2D);
                const sh = spaceship.get(Transform2D);
                rt.x = -sh.x + gameSize.x * 0.5;
                rt.y = -sh.y + gameSize.y * 0.5;
                rt.origin.set(sh.x, sh.y);
                rt.rotation = -sh.rotation - Math.PI * 0.5;
            }

            ++gameStatesCount;
        }

        if (gameStatesCount == 0) {
            this.factory.spawnGame();
        }

    }
}