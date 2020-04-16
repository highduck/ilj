import {declTypeID} from "../../util/TypeID";
import {Entity} from "../../ecs/Entity";
import {Transform2D} from "../display/Transform2D";
import {lerp, quadOut, Vec2} from "@highduck/math";

class TrailNode {
    readonly position = new Vec2();
    energy = 0;
    alpha = 0;
    scale = 1;
}

const VEC2_0 = new Vec2();
const VEC2_1 = new Vec2();

export class Trail {
    static TYPE_ID = declTypeID();
    readonly entity!: Entity;

    enabled = true;

    readonly offset = new Vec2();
    drainSpeed = 2.0;
    widthMax = 20.0;
    widthMin = 5.0;
    segmentMaxLength = 10.0;
    particlesPerSecond = 15.0;
    scale = 1;

    //private
    private _trackedTarget?: Entity = undefined;
    private _position = new Vec2();
    private _positionLast = new Vec2();
    _nodes: TrailNode[] = [];
    private _particlesGen = 0.0;
    vx: number[] = [];
    vy: number[] = [];
    private _autoUpdate = true;

    set trackedEntity(e: Entity | undefined) {
        this._trackedTarget = e;
        if (this._trackedTarget) {
            const pos = this._position;
            // position from tracked local space (with offset) to global and to local entity owner
            Transform2D.updateLocalMatrixInTree(this.entity);
            Transform2D.updateLocalMatrixInTree(this._trackedTarget);
            Transform2D.localToLocal(this._trackedTarget, this.entity, this.offset, pos);

            this._positionLast.copyFrom(pos);
            this._nodes.length = 0;
            // tail
            this._nodes[0] = new TrailNode();
            this._nodes[0].position.copyFrom(pos);
            this._nodes[0].energy = 0;
            this._nodes[0].alpha = 1;
            this._nodes[0].scale = 1;
            // head
            this._nodes[1] = new TrailNode();
            this._nodes[1].position.copyFrom(pos);
            this._nodes[1].energy = 1;
            this._nodes[1].alpha = 1;
            this._nodes[1].scale = 1;
        }
    }

    update(dt: number) {
        const head = this._nodes[this._nodes.length - 1];
        if (this._trackedTarget && this._trackedTarget.isValid) {
            const pos = this._position;
            Transform2D.updateLocalMatrixInTree(this._trackedTarget);
            Transform2D.updateLocalMatrixInTree(this.entity);
            Transform2D.localToLocal(this._trackedTarget, this.entity, this.offset, pos);
            this.updatePosition(dt);
        } else {
            head.energy -= dt;
            if (head.energy < 0.0) {
                head.energy = 0.0;
            }
            if (this._nodes.length == 1 && head.energy <= 0.0) {
                // todo: auto-destroy
                //            view.Dispose();
                //            view = null;
                return;
            }
        }

        let i = 0;
        while (i < this._nodes.length - 1) {
            const node = this._nodes[i];
            node.energy -= dt * this.drainSpeed;
            if (node.energy <= 0.0) {
                node.energy = 0.0;
                if (this._nodes[i + 1].energy <= 0.0) {
                    this._nodes.splice(i, 1);
                } else {
                    ++i;
                }
            } else {
                ++i;
            }
        }

        // todo:
        this.updateMesh();
    }

    private updatePosition(dt: number) {
        //nextPosition.x += FastMath.Range(-10f, 10f);
        //nextPosition.y += FastMath.Range(-10f, 10f);
        const positionLast = this._positionLast;
        const direction: Vec2 = this._position.copy().subtract(this._positionLast);
        let distance = direction.length;

        direction.normalizeScale(this.segmentMaxLength);

        //    auto limit = 100u;
        while (distance >= this.segmentMaxLength) { // && limit > 0u
            distance -= this.segmentMaxLength;
            this.insertNewNode(positionLast.add(direction));
            //        --limit;
        }

        // if (ps != null) {
        //     spawnParticles(pos, direction, dt);
        // }

        this._nodes[this._nodes.length - 1].position.copyFrom(this._position);
    }

    private spawnParticles(pos: Vec2, dir: Vec2, dt: number) {
        const power = this._nodes[this._nodes.length - 1].alpha;
        this._particlesGen += power * dt * this.particlesPerSecond;

    }

    private insertNewNode(pos: Vec2) {
        const head = this._nodes[this._nodes.length - 1];
        const created = new TrailNode();
        created.position.copyFrom(pos);
        created.energy = head.energy;
        created.alpha = head.alpha;
        created.scale = this.scale;
        this._nodes[this._nodes.length - 1] = created;
        this._nodes.push(head);
    }

    private updateMesh() {
        const total = this._nodes.length;
        const count = total * 2;

        while (this.vx.length < count) {
            this.vx.push(0);
            this.vy.push(0);
        }

        if (total > 0) {
            // sync HEAD scale
            this._nodes[this._nodes.length - 1].scale = this.scale;
        }

        let vi = 0;
        const perp = VEC2_0;
        const perp2 = VEC2_1;
        for (let i = 0; i < total; ++i) {
            const node = this._nodes[i];
            const p = node.position;
            if (i > 0) {
                perp.copyFrom(this._nodes[i - 1].position).subtract(p).normalize();
                if (i + 1 < total) {
                    perp2.copyFrom(p).subtract(this._nodes[i + 1].position).normalize();
                    perp.lerp(perp2, 0.5).normalize();
                }
                perp.perpendicular();
            } else {
                perp.set(0, 0);
            }

//        if (i == total - 1) {
//            perp = YUnit2;
//        }

            perp.scale(node.scale * lerp(this.widthMin, this.widthMax, quadOut(node.energy)));
            this.vx[vi] = p.x - perp.x;
            this.vy[vi] = p.y - perp.y;
            ++vi;
            this.vx[vi] = p.x + perp.x;
            this.vy[vi] = p.y + perp.y;
            ++vi;
            //m -= dm;
        }
//    view.SetPositions(vertices, count);

    }
}

