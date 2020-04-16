import {Matrix2D, Rect, Vec2, Color4} from "@highduck/math";
import {Entity} from "../../ecs/Entity";
import {declTypeID} from "../../util/TypeID";

const TMP_MATRIX = new Matrix2D();
const TEMP_VEC2_0 = new Vec2();
const TEMP_VEC2_1 = new Vec2();

export class Transform2D {
    static TYPE_ID = declTypeID();
    readonly entity!: Entity;

    readonly matrix = new Matrix2D();
    readonly position: Vec2 = new Vec2(0, 0);
    readonly scale: Vec2 = new Vec2(1, 1);
    readonly skew: Vec2 = new Vec2(0, 0);
    readonly origin: Vec2 = new Vec2(0, 0);
    readonly pivot: Vec2 = new Vec2(0, 0);
    readonly rect: Rect = new Rect();

    customMatrix?: Matrix2D = undefined;

    readonly colorMultiplier = new Color4(1, 1, 1, 1);
    readonly colorOffset = new Color4(0, 0, 0, 0);

    scissors: Rect | undefined = undefined;
    hitArea: Rect | undefined = undefined;

    static getWorldMatrix(entity: Entity, out: Matrix2D): Matrix2D {
        let e: Entity | undefined = entity;
        while (e !== undefined) {
            const tr = e.tryGet(Transform2D);
            if (tr !== undefined) {
                tr.getWorldMatrix(out);
                return out;
            }
            e = e.parent;
        }
        out.copyFrom(Matrix2D.IDENTITY);
        return out;
    }

    getWorldMatrix(out: Matrix2D): Matrix2D {
        const e = this.entity;
        while (e.parent !== undefined) {
            const tr = e.parent.tryGet(Transform2D);
            if (tr !== undefined) {
                tr.getWorldMatrix(out).mult(this.matrix);
                return out;
            }
        }
        out.copyFrom(this.matrix);
        return out;
    }

    getWorldScissors(worldMatrix: Matrix2D, out: Rect) {
        if (this.scissors !== undefined) {
            const lt = worldMatrix.transform(this.scissors.x, this.scissors.y, TEMP_VEC2_0);
            const rb = worldMatrix.transform(this.scissors.right, this.scissors.bottom, TEMP_VEC2_1);
            out.x = Math.min(lt.x, rb.x);
            out.y = Math.min(lt.y, rb.y);
            const mx = Math.max(lt.x, rb.x);
            const my = Math.max(lt.y, rb.y);
            out.width = mx - out.x;
            out.height = my - out.y;
        }
    }

    set x(value: number) {
        this.position.x = value;
    }

    get x(): number {
        return this.position.x;
    }

    set y(value: number) {
        this.position.y = value;
    }

    get y(): number {
        return this.position.y;
    }

    set rotation(value: number) {
        this.skew.x = value;
        this.skew.y = value;
    }

    get rotation(): number {
        return this.skew.x === this.skew.y ? this.skew.x : 0;
    }

    rotate(value: number) {
        this.skew.x += value;
        this.skew.y += value;
    }

    set alpha(v: number) {
        this.colorMultiplier.a = v;
    }

    get alpha(): number {
        return this.colorMultiplier.a;
    }

    set additive(v: number) {
        this.colorOffset.a = v;
    }

    get additive(): number {
        return this.colorOffset.a;
    }

    invalidateMatrix(): Matrix2D {
        if (this.customMatrix) {
            this.matrix.copyFrom(this.customMatrix);
        } else {
            this.matrix.set(1, 0, 0, 1,
                this.origin.x,
                this.origin.y);
            TMP_MATRIX.setScaleSkew(
                this.scale.x,
                this.scale.y,
                this.skew.x,
                this.skew.y,
            );
            TMP_MATRIX.x = this.position.x;
            TMP_MATRIX.y = this.position.y;
            this.matrix.mult(TMP_MATRIX);
            this.matrix.translate(-this.origin.x - this.pivot.x, -this.origin.y - this.pivot.y);
        }
        return this.matrix;
    }

    static globalToLocal(e: Entity, pos: Vec2, out: Vec2) {
        out.copyFrom(pos);
        Transform2D.transformDown(undefined, e, out);
    }

    static globalToParent(e: Entity, pos: Vec2, out: Vec2) {
        out.copyFrom(pos);
        Transform2D.transformDown(undefined, e.parent, out);
    }

    static updateLocalMatrixInTree(e: Entity) {
        let it: Entity | undefined = e;
        while (it !== undefined) {
            it.tryGet(Transform2D)?.invalidateMatrix();
            it = it.parent;
        }
    }

    static transformUp(it: Entity | undefined, top: Entity | undefined, out: Vec2) {
        while (it !== top && it !== undefined) {
            const transform = it.tryGet(Transform2D);
            if (transform !== undefined) {
                out.transform(transform.matrix);
            }
            it = it.parent;
        }
    }

    static transformDown(top: Entity | undefined, it: Entity | undefined, out: Vec2) {
        while (it !== top && it !== undefined) {
            const transform = it.tryGet(Transform2D);
            if (transform !== undefined) {
                transform.matrix.transformInverse(out.x, out.y, out);
            }
            it = it.parent;
        }
    }

    static localToGlobal(e: Entity, pos: Vec2, out: Vec2) {
        out.copyFrom(pos);
        Transform2D.transformUp(e, undefined, out);
    }

    static parentToGlobal(e: Entity, pos: Vec2, out: Vec2) {
        out.copyFrom(pos);
        Transform2D.transformUp(e.parent, undefined, out);
    }

    static findDepth(e: Entity): number {
        let depth = 0;
        let it: Entity | undefined = e.parent;
        while (it !== undefined) {
            ++depth;
            it = it.parent;
        }
        return depth;
    }

    static findLowerCommonAncestor(e1: Entity, e2: Entity): Entity | undefined {
        let depth1 = Transform2D.findDepth(e1);
        let depth2 = Transform2D.findDepth(e2);
        let it1: Entity | undefined = e1;
        let it2: Entity | undefined = e2;
        while (depth1 > depth2) {
            it1 = it1?.parent;
            --depth1;
        }
        while (depth2 < depth1) {
            it2 = it2?.parent;
            --depth2;
        }
        while (it1 !== it2) {
            it1 = it1?.parent;
            it2 = it2?.parent;
        }
        return it1;
    }

    static localToLocal(src: Entity, dest: Entity, pos: Vec2, out: Vec2) {
        out.copyFrom(pos);
        const lca = Transform2D.findLowerCommonAncestor(src, dest);
        if (lca !== undefined) {
            Transform2D.transformUp(src, lca, out);
            Transform2D.transformDown(lca, dest, out);
        }
    }

    static getTransformationMatrix(src: Entity, dest: Entity, out: Matrix2D) {
        out.copyFrom(Matrix2D.IDENTITY);
        const common = Transform2D.findLowerCommonAncestor(src, dest);
        if (common !== undefined) {
            let it: Entity | undefined = dest;
            while (it !== common && it !== undefined) {
                const transform = it.tryGet(Transform2D);
                if (transform !== undefined) {
                    out.mult(transform.matrix);
                }
                it = it.parent;
            }
            out.inverse();
            it = src;
            while (it !== common && it !== undefined) {
                const transform = it.tryGet(Transform2D);
                if (transform !== undefined) {
                    out.mult(transform.matrix);
                }
                it = it.parent;
            }
        }
    }
}