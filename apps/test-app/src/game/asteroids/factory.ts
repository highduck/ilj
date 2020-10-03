import {RndDefault, DisplayQuad, Entity, EntityAge, Transform2D, Transform2D_Data} from "@highduck/core";
import {
    Animation,
    Asteroid,
    Bullet,
    Collision,
    GameState,
    Gun,
    GunControls, GunData,
    Motion,
    MotionControl,
    Spaceship
} from "./components";
import {Vec2} from "@highduck/math";
import {Fsm} from "./fsm";

export class GameFactory {

    constructor(public readonly root: Entity) {
    }

    createSpaceshipView(parent: Entity): Entity {
        const e = parent.create();
        e.set(Transform2D);
        e.set(DisplayQuad).rect.set(-10, -10, 20, 20);
        return e;
        // auto* spr = new sf::ConvexShape();
        // spr->setFillColor(sf::Color::White);
        // spr->setPointCount(4);
        // spr->setPoint(0, sf::Vector2f(10, 0));
        // spr->setPoint(1, sf::Vector2f(-7, 7));
        // spr->setPoint(2, sf::Vector2f(-4, 0));
        // spr->setPoint(3, sf::Vector2f(-7, -7));
        // return spr;

    }

    createAsteroidView(parent: Entity, radius: number): Entity {
        const e = parent.create();
        e.set(Transform2D);
        const q = e.set(DisplayQuad);
        q.rect.set(-radius, -radius, 2 * radius, 2 * radius);
        q.color = 0xFF997788;
        return e;
        //
        // float angle = 0.0f;
        // std::vector<float2> vertices;
        // while (angle < M_PI * 2.0f) {
        //     vertices.push_back(direction(angle) * rnd(0.75f, 1.0f) * radius);
        //     angle += rnd() * 0.5f;
        // }
        //
        // auto* spr = new sf::ConvexShape();
        // spr->setFillColor(sf::Color::White);
        // spr->setPointCount(vertices.size());
        // int i = 0;
        // for (auto& v: vertices) {
        //     spr->setPoint(i, sf::Vector2f(v.x, v.y));
        //     ++i;
        // }
        // return spr;
    }

    createBulletView(parent: Entity): Entity {
        const radius = 2;
        const e = parent.create();
        e.set(Transform2D);
        const q = e.set(DisplayQuad);
        q.rect.set(-radius, -radius, 2 * radius, 2 * radius);
        q.color = 0xFF00FFFF;
        return e;
        // auto* spr = new sf::CircleShape();
        // spr->setRadius(radius);
        // spr->setFillColor(sf::Color::White);
        // return spr;
    }

    spawnGame(): Entity {
        const e = this.root.create();
        e.set(GameState);
        return e;
    }

    spawnAsteroid(radius: number, pos: Vec2): Entity {
        const e = this.root.create();
        e.set(Asteroid);
        e.set(Transform2D).position.copyFrom(pos);
        e.set(Collision).radius = radius;
        e.set(Motion).setup(
            new Vec2(RndDefault.range(-0.5, 0.5) * 4 * (50 - radius), RndDefault.range(-0.5, 0.5) * 4 * (50 - radius)),
            RndDefault.range(-1, 1),
            0.0
        );
        this.createAsteroidView(e, radius);
        return e;
    }

    spawnSpaceship(): Entity {
        const e = this.root.create();
        const fsm = e.set(Fsm);
        const position = e.set(Transform2D);

        fsm.add("playing", {
            onEnter: e => {
                e.set(Spaceship);
                e.set(Motion).setup(new Vec2(), 0, 15);
                const mc = e.set(MotionControl);
                mc.accelerationRate = 100;
                mc.rotationRate = 3;
                const gun = e.set(Gun).setup(new Vec2(8, 0), 0.08, 2, 10);
                gun.bulletLifetime /= 2;
                gun.velocity = 800;
                e.set(GunControls).trigger = "Space";
                e.set(Collision).radius = 9;
                this.createSpaceshipView(e);
            },
            onExit: e => {
                e.delete(Spaceship);
                e.delete(Motion);
                e.delete(MotionControl);
                e.delete(Gun);
                e.delete(GunControls);
                e.delete(Collision);
                e.deleteChildren();
            }
        });

        fsm.add("destroyed", {
            onEnter: e => {
                // TODO:
//var deathAnimation = new SpaceshipDeathView();
                e.set(EntityAge).lifeRemaining = 5;
// TODO:
//_animation.set(entity, deathAnimation);
//_display.get(entity).addChild(deathAnimation);
            },
            onExit: e => {
                e.delete(EntityAge);
                e.delete(Animation);
// TODO:
//_display.get(entity).removeChildren();
            }
        });

        position.position.set(300, 225);
        position.rotation = 0;

        fsm.set("playing");

        return e;
    }

    spawnUserBullet(gun: GunData, parentPosition: Transform2D_Data): Entity {
        const rotation = parentPosition.rotation + gun.spreadAngle * RndDefault.range(-0.5, 0.5) * Math.PI / 180.0;
        const dir = new Vec2().direction(rotation);
        const velocity = gun.velocity;

        const e = this.root.create();
        e.set(Bullet);
        const position = e.set(Transform2D);
        const collision = e.set(Collision);
        const motion = e.set(Motion);

        e.set(EntityAge).lifeRemaining = gun.bulletLifetime;
        position.position.copyFrom(gun.offsetFromParent).rotate_unit(dir).add(parentPosition.position);
        position.rotation = parentPosition.rotation;
        collision.radius = 0.0;
        motion.setup(dir.copy().scale(velocity), 0.0, 0.0);

        this.createBulletView(e);
        return e;
    }
}
