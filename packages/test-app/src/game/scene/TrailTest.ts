import {
    ParticleRenderer,
    EmitterData,
    Engine,
    Entity,
    ParticleAlphaMode,
    ParticleDecl,
    ParticleEmitter,
    ParticleLayer,
    ParticleScaleMode,
    Resources,
    Sprite,
    TargetFollow,
    Trail,
    TrailRenderer,
    Transform2D
} from "@highduck/core";

function initDustParticles(engine: Engine): ParticleDecl {
    const decl = new ParticleDecl();
    decl.sprite = Resources.get(Sprite, "old/rect");
    decl.alphaMode = ParticleAlphaMode.LifeSine;
    decl.angleVelocityFactor = 0.3;
    decl.scaleMode = ParticleScaleMode.Range;
    decl.accPhaseX.range(0, 6);
    decl.accSpeedX.value(2 * Math.PI);
    decl.lifeTime.range(1, 5);
    decl.scaleStart.range(0.2, 0.7);
    decl.scaleEnd.range(0.2, 0.7);
    decl.colorOffset.a = 1;
    decl.alphaStart.range(0.2, 0.5);
    Resources.get(ParticleDecl, "dust").reset(decl);
    return decl;
}

export class TrailDemo {
    mouse: Entity;
    trail: Entity;
    ps: Entity;

    constructor() {
        const engine = Engine.current;
        const base = Entity.root.create();
        base.name = "Trail Demo";

        this.mouse = base.create();
        this.mouse.name = "Target";
        this.mouse.set(Transform2D);
        this.mouse.set(TargetFollow).cameraPointer = Entity.root.find("MainCamera");
        this.mouse.touchable = false;

        this.ps = base.create();
        this.ps.set(ParticleLayer);
        this.ps.set(ParticleRenderer);

        this.trail = base.create();
        this.trail.name = "Trail";
        this.trail.set(Transform2D);
        this.trail.set(Trail).trackedEntity = this.mouse;
        this.trail.set(TrailRenderer);

        initDustParticles(engine);

        const emitter = this.mouse.set(ParticleEmitter);
        emitter.data = new EmitterData();
        emitter.data.particle = Resources.get(ParticleDecl, "dust");
        emitter.data.interval = 0.01;
        emitter.data.burst = 10;
        // emitter.data.rect = screen_rect;
        emitter.data.speed.value(30);
        emitter.data.acc.value(20);
        emitter.layer = this.ps;

        // const gui = new dat.GUI();
        // const gui_emitter = gui.addFolder("emitter");
        // gui_emitter.add(emitter.data, 'interval', 0, 1, 0.0001);
        // gui_emitter.add(emitter.data, 'burst', 1, 100, 1).listen().name("burst");
        // gui_emitter.add(emitter.data.speed, 'min', -100, 100).listen().name("speed.min");
        // gui_emitter.add(emitter.data.speed, 'max', -100, 100).listen().name("speed.max");
        // gui_emitter.add(emitter.data.acc, 'min', -100, 100).listen().name("acc.min");
        // gui_emitter.add(emitter.data.acc, 'max', -100, 100).listen().name("acc.max");
        //
        // const gui_part = gui.addFolder("particle");
        // gui_part.add(decl, 'scaleMode', [ParticleScaleMode.None, ParticleScaleMode.CosOut, ParticleScaleMode.Range]);
        // gui_part.add(decl, 'alphaMode', [ParticleAlphaMode.None, ParticleAlphaMode.ByScale, ParticleAlphaMode.LifeSine, ParticleAlphaMode.DCBlink]);
        // gui_part.add(decl.alphaStart, 'min', 0, 1, 0.0001).listen().name("alphaStart.min");
        // gui_part.add(decl.alphaStart, 'max', 0, 1, 0.0001).listen().name("alphaStart.max");
        // gui_part.add(decl.acceleration, 'x', 0, 1, 0.0001).listen().name("acceleration.x");
        // gui_part.add(decl.acceleration, 'y', 0, 1, 0.0001).listen().name("acceleration.y");
        // gui_part.add(decl, 'useReflector');
        // gui_part.add(decl.lifeTime, 'min', 0, 1, 0.0001).listen().name("lifeTime.min");
        // gui_part.add(decl.lifeTime, 'max', 0, 1, 0.0001).listen().name("lifeTime.max");
        // gui_part.add(decl.accPhaseX, 'min', 0, 2 * Math.PI, 0.01).listen().name("accPhaseX.min");
        // gui_part.add(decl.accPhaseX, 'max', 0, 2 * Math.PI, 0.01).listen().name("accPhaseX.max");
        // gui_part.add(decl.accSpeedX, 'min', 0, 2 * Math.PI, 0.01).listen().name("accSpeedX.min");
        // gui_part.add(decl.accSpeedX, 'max', 0, 2 * Math.PI, 0.01).listen().name("accSpeedX.max");
        // gui_part.add(decl, 'scaleOffTime', 0, 1, 0.01).listen().name("scaleOffTime");
        // gui_part.add(decl.scaleStart, 'min', 0, 1, 0.01).listen().name("scaleStart.min");
        // gui_part.add(decl.scaleStart, 'max', 0, 1, 0.01).listen().name("scaleStart.max");
        // gui_part.add(decl.scaleEnd, 'min', 0, 1, 0.01).listen().name("scaleEnd.min");
        // gui_part.add(decl.scaleEnd, 'max', 0, 1, 0.01).listen().name("scaleEnd.max");
        //
        // gui_part.add(decl.rotation, 'min', 0, 2 * Math.PI, 0.01).listen().name("rotation.min");
        // gui_part.add(decl.rotation, 'max', 0, 2 * Math.PI, 0.01).listen().name("rotation.max");
        //
        // gui_part.add(decl, 'rotationSpeed', 0, 1, 0.01).listen().name("rotationSpeed");
        // gui_part.add(decl, 'angleVelocityFactor', 0, 1, 0.01).listen().name("angleVelocityFactor");
        // gui_part.add(decl, 'angleBase', 0, 2 * Math.PI, 0.01).listen().name("angleBase");
        // gui_part.add(decl.color, 'mode', [RandomColorMode.Continuous, RandomColorMode.RandomLerp, RandomColorMode.RandomElement]).listen().name("color.mode");
        // gui_part.add(decl.color, 'state', true).listen().name("color.state");
        // gui_part.add(decl.colorOffset, 'w', 0, 1, 0.01).listen().name("additive");
    }
}