import {GameFactory} from "./factory";
import {GameSystem} from "./systems/GameSystem";
import {Fsm} from "./fsm";
import {MovementSystem} from "./systems/MovementSystem";
import {ControlSystem} from "./systems/ControlSystem";
import {CollisionSystem} from "./systems/CollisionSystem";
import {Engine, Entity} from "@highduck/core";

export class Asteroids {

    base: Entity;

    factory: GameFactory;
    gameSystem: GameSystem;
    movement: MovementSystem;
    controls: ControlSystem;
    collisions: CollisionSystem;

    constructor() {
        const engine = Engine.current;
        this.base = engine.root.create();
        this.base.name = "Asteroids Demo";

        this.factory = new GameFactory(this.base);
        engine.register(this.factory);

        this.gameSystem = new GameSystem(this.factory);
        this.movement = new MovementSystem(this.base);
        this.controls = new ControlSystem(engine);
        this.collisions = new CollisionSystem(this.factory);
    }

    update() {
        this.controls.update();
        Fsm.update();
        this.movement.update();
        this.collisions.update();
        this.gameSystem.update();
    }
}