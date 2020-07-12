import {ParticleLayer, ParticleLayer_Data} from "./ParticleLayer";
import {ParticleEmitter} from "./ParticleEmitter";
import {Particle} from "./Particle";
import {EmitterData, ParticleDecl} from "./ParticleDecl";
import {Entity} from "../../ecs/Entity";
import {Transform2D_Data} from "../display/Transform2D";
import {Matrix2D, RndDefault, Vec2} from "@highduck/math";
import {Resources} from "../..";
import {getComponents} from "../../ecs/World";

const TEMP_MATRIX_2D = new Matrix2D();
const TEMP_VEC2_POS = new Vec2();

export function findParticleLayer(e: Entity): ParticleLayer_Data {
    const emitter = e.tryGet(ParticleEmitter);
    if (emitter && emitter.layer) {
        e = emitter.layer;
    }
    return e.getOrCreate(ParticleLayer);
}

function addParticle(layer: ParticleLayer_Data, particle?: Particle) {
    if (particle) {
        layer.particles.primary.push(particle);
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

export function spawnFromEmitter(src: Entity, layer: ParticleLayer_Data, particle: ParticleDecl, data: EmitterData, count: number) {
    if (count <= 0) {
        return;
    }
    let a = data.dir.random();
    Transform2D_Data.updateLocalMatrixInTree(layer.entity);
    Transform2D_Data.updateLocalMatrixInTree(src);
    Transform2D_Data.getTransformationMatrix(src, layer.entity, TEMP_MATRIX_2D);
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

export function spawnParticle(e: Entity, particle_id: string): Particle | undefined {
    const decl = Resources.data(ParticleDecl, particle_id);
    if (decl) {
        const p = produceParticle(decl);
        const to_layer = e.getOrCreate(ParticleLayer);
        addParticle(to_layer, p);
        return p;
    }
    return undefined;
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

export function updateParticleEmitters() {
    const emitters = getComponents(ParticleEmitter);
    for (let i = 0; i < emitters.length; ++i) {
        const emitter = emitters[i];
        const dt = emitter.timer.dt;
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

export function updateParticleSystems() {
    const layers = getComponents(ParticleLayer);
    for (let i = 0; i < layers.length; ++i) {
        const layer = layers[i];
        const dt = layer.timer.dt;
        const particles = layer.particles.primary;
        const alive = layer.particles.secondary;
        for (let i = 0, e = particles.length; i < e; ++i) {
            const p = particles[i];
            p.update(dt);
            if (p.time > 0) {
                alive.push(p);
            }
        }
        layer.particles.commit();
    }
}