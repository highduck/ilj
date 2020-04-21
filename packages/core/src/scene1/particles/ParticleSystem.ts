import {ParticleLayer} from "./ParticleLayer";
import {ParticleEmitter} from "./ParticleEmitter";
import {Particle} from "./Particle";
import {EmitterData, ParticleDecl} from "./ParticleDecl";
import {Entity} from "../../ecs/Entity";
import {Transform2D} from "../display/Transform2D";
import {RndDefault, Matrix2D, Vec2} from "@highduck/math";
import {Engine} from "../../Engine";

const TEMP_MATRIX_2D = new Matrix2D();
const TEMP_VEC2_POS = new Vec2();

export function findParticleLayer(e: Entity): ParticleLayer {
    const emitter = e.tryGet(ParticleEmitter);
    if (emitter && emitter.layer) {
        e = emitter.layer;
    }
    return e.getOrCreate(ParticleLayer);
}

function addParticle(layer: ParticleLayer, particle?: Particle) {
    if (particle) {
        layer.particles.push(particle);
        particle.init();
    }
}

function produceParticle(decl: ParticleDecl): Particle {
    const p = new Particle();
    p.sprite = decl.sprite;
    p.ax = decl.acceleration.x;
    p.ay = decl.acceleration.y;
    p.alphaMode = decl.alphaMode;
    p.scaleMode = decl.scaleMode;
    p.font = decl.font;
    p.fontSize = decl.fontSize;
    p.accPhaseX = decl.accPhaseX.random();
    p.accSpeedX = decl.accSpeedX.random();
    p.scaleOffTime = decl.scaleOffTime;
    p.scaleStart = decl.scaleStart.random();
    p.scaleEnd = decl.scaleEnd.random();
    decl.color.random(p.color);
    p.angleVelocityFactor = decl.angleVelocityFactor;
    p.angleBase = decl.angleBase;
    p.rotationSpeed = decl.rotationSpeed;
    p.rotation = decl.rotation.random();
    p.alpha = decl.alphaStart.random();
    p.setLifeTime(decl.lifeTime.random());
    p.offset.copyFrom(decl.colorOffset);
    return p;
}

export function spawnFromEmitter(src: Entity, layer: ParticleLayer, particle: ParticleDecl, data: EmitterData, count: number) {
    if (count <= 0) {
        return;
    }
    let a = data.dir.random();
    Transform2D.updateLocalMatrixInTree(layer.entity);
    Transform2D.updateLocalMatrixInTree(src);
    Transform2D.getTransformationMatrix(src, layer.entity, TEMP_MATRIX_2D);
    while (count > 0) {
        const p = produceParticle(particle);
        addParticle(layer, p);
        const x = data.offset.x + RndDefault.range(data.rect.x, data.rect.right);
        const y = data.offset.y + RndDefault.range(data.rect.y, data.rect.bottom);
        TEMP_MATRIX_2D.transform(x, y, TEMP_VEC2_POS);
        p.x = TEMP_VEC2_POS.x;
        p.y = TEMP_VEC2_POS.y;
        const speed = data.speed.random();
        const acc = data.acc.random();
        const dx = Math.cos(a);
        const dy = Math.sin(a);
        p.vx = dx * speed;
        p.vy = dy * speed;
        if (data.velocity) {
            p.vx += data.velocity.x;
            p.vy += data.velocity.y;
        }
        p.ax += dx * acc;
        p.ay += dy * acc;
        if (data.onSpawn !== undefined) {
            data.onSpawn(p);
        }

        --count;
        a += data.burstRotationDelta.random();
    }
}

export function particlesBurst(e: Entity, count: number, velocity?: Vec2) {
    const emitter = e.tryGet(ParticleEmitter);
    if (emitter && emitter.data !== undefined) {
        const decl = emitter.particleData;
        if (decl !== undefined) {
            const layer = findParticleLayer(e);
            spawnFromEmitter(e, layer, decl, emitter.data, count);
        }
    }
}

export class ParticleSystem {
    constructor(readonly engine: Engine) {
    }

    process() {
        this.updateEmitters();
        this.updateParticles();
    }

    updateEmitters() {
        for (const emitter of this.engine.world.query(ParticleEmitter)) {
            const e = emitter.entity;
            const dt = e.dt;
            if (!emitter.enabled) {
                continue;
            }
            emitter.time += dt;
            const data = emitter.data;
            if (data !== undefined && emitter.time >= data.interval) {
                let count = data.burst;
                if (count > 0) {
                    const particle = emitter.particleData;
                    if (particle !== undefined) {
                        const layer = findParticleLayer(emitter.entity);
                        spawnFromEmitter(emitter.entity, layer, particle, data, count);
                    }
                }
                emitter.time = 0;
            }
        }
    }

    updateParticles() {
        for (const layer of this.engine.world.query(ParticleLayer)) {
            const dt = layer.entity.dt;
            const alive = [];
            for (const p of layer.particles) {
                p.update(dt);
                if (p.isAlive()) {
                    alive.push(p);
                }
            }
            layer.particles = alive;
        }
    }
}