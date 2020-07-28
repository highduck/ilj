import {Transform2D_Data} from "../display/Transform2D";
import {lerp, quadOut, Vec2} from "@highduck/math";
import {Time, TimeLayer} from "../../app/Time";
import {Entity, EntityComponentType} from "../../ecs";
import {F32Vector, ObjectCoolArray} from "../..";

class TrailNode {
    x = NaN;
    y = NaN;
    energy = NaN;
    alpha = NaN;
    scale = NaN;

    constructor() {
        this.x = 0.0;
        this.y = 0.0;
        this.energy = 0.0;
        this.alpha = 0.0;
        this.scale = 1.0;
    }
}

export class TrailSettings {
    scale = 1.0;
    drainSpeed = 2.0;
    widthMax = 20.0;
    widthMin = 5.0;
    segmentMaxLength = 20.0;
    timer: TimeLayer = Time.ROOT;
}

const VEC2_0 = new Vec2();
const VEC2_1 = new Vec2();

export class Trail_Data {
    constructor(readonly entity: Entity) {
    }

    readonly settings = new TrailSettings();
    readonly offset = new Vec2();
    readonly vertices = new F32Vector(32);

    //private
    readonly _nodes = new ObjectCoolArray<TrailNode>();
    private _trackedTarget: Entity | null = null;
    private _position = new Vec2();
    private _positionLast = new Vec2();
    // private _particlesGen = 0.0;
    // get timer() {
    //     return Time.ROOT;
    // }

    // set timer(v: TimeLayer) {
    // }

    set trackedEntity(e: Entity | null) {
        this._trackedTarget = e;
        if (this._trackedTarget) {
            const pos = this._position;
            // position from tracked local space (with offset) to global and to local entity owner
            Transform2D_Data.updateLocalMatricesForLink(this._trackedTarget, this.entity);
            Transform2D_Data.localToLocal(this._trackedTarget, this.entity, this.offset, pos);

            this._positionLast.copyFrom(pos);
            this._nodes.clear();
            // tail
            let node = new TrailNode();
            node.x = pos.x;
            node.y = pos.y;
            node.energy = 0.0;
            node.alpha = 1.0;
            node.scale = 1.0;
            this._nodes.push(node);
            // head
            node = new TrailNode();
            node.x = pos.x;
            node.y = pos.y;
            node.energy = 1.0;
            node.alpha = 1.0;
            node.scale = 1.0;
            this._nodes.push(node);
        }
    }

    updateTrail() {
        const dt = this.settings.timer.dt;
        if (this._trackedTarget && this._trackedTarget.isValid) {
            const pos = this._position;
            Transform2D_Data.localToLocal(this._trackedTarget, this.entity, this.offset, pos);
            this.updatePosition(dt);
        }
        // else {
        //     head.energy -= dt;
        //     if (head.energy < 0.0) {
        //         head.energy = 0.0;
        //     }
        //     if (this._nodes.length === 1 && head.energy <= 0.0) {
        //         // todo: auto-destroy
        //         //            view.Dispose();
        //         //            view = null;
        //         return;
        //     }
        // }

        let i = 0;
        const energyDelta = dt * this.settings.drainSpeed;
        while (i < this._nodes.count - 1) {
            const node = this._nodes.get(i);
            node.energy -= energyDelta;
            if (node.energy <= 0.0) {
                node.energy = 0.0;
                if (this._nodes.get(i + 1).energy <= 0.0) {
                    // this._nodes.splice(i, 1);
                    this._nodes.remove(i);
                } else {
                    ++i;
                }
            } else {
                ++i;
            }
        }
    }

    private updatePosition(dt: number) {
        //nextPosition.x += FastMath.Range(-10f, 10f);
        //nextPosition.y += FastMath.Range(-10f, 10f);
        const positionLast = this._positionLast;
        const p = VEC2_0.copyFrom(this._position);
        const direction: Vec2 = p.subtract(this._positionLast);
        let distance = direction.length;

        const segLen = this.settings.segmentMaxLength;
        direction.normalizeScale(segLen);

        //    auto limit = 100u;
        while (distance >= segLen) { // && limit > 0u
            distance -= segLen;
            this.insertNewNode(positionLast.add(direction));
            //        --limit;
        }

        // if (ps != null) {
        //     spawnParticles(pos, direction, dt);
        // }

        const lastNode = this._nodes.back();
        lastNode.x = this._position.x;
        lastNode.y = this._position.y;
    }

    // private spawnParticles(pos: Vec2, dir: Vec2, dt: number) {
    //     const power = this._nodes[this._nodes.length - 1].alpha;
    //     this._particlesGen += power * dt * this.particlesPerSecond;
    //
    // }

    private insertNewNode(pos: Vec2) {
        if (this._nodes.count > 0) {
            const head = this._nodes.back();
            const created = new TrailNode();
            created.x = pos.x;
            created.y = pos.y;
            created.energy = head.energy;
            created.alpha = head.alpha;
            created.scale = this.settings.scale;
            this._nodes.setBack(created);
            this._nodes.push(head);
        }
    }

    updateMesh() {
        const total = this._nodes.count;

        if (total > 0) {
            // sync HEAD scale
            this._nodes.back().scale = this.settings.scale;
        }
        const perp = VEC2_0;
        const perp2 = VEC2_1;

        this.vertices.clear();

        for (let i = 0; i < total; ++i) {
            const node = this._nodes.get(i);
            if (i > 0) {
                const nodePrev = this._nodes.get(i - 1);
                perp.set(nodePrev.x - node.x, nodePrev.y - node.y).normalize();
                if (i + 1 < total) {
                    const nodeNext = this._nodes.get(i + 1);
                    perp2.set(node.x - nodeNext.x, node.y - nodeNext.y).normalize();
                    perp.lerp(perp2, 0.5).normalize();
                }
                perp.perpendicular();
            } else {
                perp.set(0.0, 0.0);
            }

//        if (i == total - 1) {
//            perp = YUnit2;
//        }

            perp.scale(node.scale * lerp(this.settings.widthMin, this.settings.widthMax, quadOut(node.energy)));

            this.vertices.push(node.x - perp.x);
            this.vertices.push(node.y - perp.y);
            this.vertices.push(node.x + perp.x);
            this.vertices.push(node.y + perp.y);
            //m -= dm;
        }
//    view.SetPositions(vertices, count);

    }

    dispose() {

    }
}

export const Trail = new EntityComponentType(Trail_Data);
