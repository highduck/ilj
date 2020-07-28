import {Color4, Matrix2D, Recta, Vec2} from "@highduck/math";
import {Entity, PoolComponentType} from "../../ecs";

const TEMP_VEC2_0 = new Vec2();
const TEMP_VEC2_1 = new Vec2();

export class Transform2D_Data {
    static IDENTITY: Readonly<Transform2D_Data> = new Transform2D_Data();

    readonly position = new Vec2(0.0, 0.0);
    readonly scale = new Vec2(1.0, 1.0);
    readonly skew = new Vec2(0.0, 0.0);
    readonly origin = new Vec2(0.0, 0.0);
    readonly pivot = new Vec2(0.0, 0.0);

    readonly matrix = new Matrix2D();
    readonly worldMatrix = new Matrix2D();

    readonly colorMultiplier = new Color4(1.0, 1.0, 1.0, 1.0);
    readonly colorOffset = new Color4(0.0, 0.0, 0.0, 0.0);
    readonly worldColorMultiplier = new Color4(1.0, 1.0, 1.0, 1.0);
    readonly worldColorOffset = new Color4(0.0, 0.0, 0.0, 0.0);

    readonly rect = new Recta();
    readonly scissors = new Recta();
    readonly hitArea = new Recta();

    flagRect = false;
    flagScissors = false;
    flagHitArea = false;

    reset() {
        this.colorMultiplier.set(1.0, 1.0, 1.0, 1.0);
        this.colorOffset.set(0.0, 0.0, 0.0, 0.0);
        this.position.set(0.0, 0.0);
        this.skew.set(0.0, 0.0);
        this.scale.set(1.0, 1.0);
        this.origin.set(0.0, 0.0);
        this.pivot.set(0.0, 0.0);

        this.flagRect = false;
        this.flagScissors = false;
        this.flagHitArea = false;
    }

    getScreenScissors(viewMatrix: Matrix2D, worldMatrix: Matrix2D, out: Recta) {
        const lt = worldMatrix.transform(this.scissors.x, this.scissors.y, TEMP_VEC2_0);
        const rb = worldMatrix.transform(this.scissors.right, this.scissors.bottom, TEMP_VEC2_1);

        viewMatrix.transform(lt.x, lt.y, lt);
        viewMatrix.transform(rb.x, rb.y, rb);

        out.x = Math.min(lt.x, rb.x);
        out.y = Math.min(lt.y, rb.y);
        const mx = Math.max(lt.x, rb.x);
        const my = Math.max(lt.y, rb.y);
        out.width = mx - out.x;
        out.height = my - out.y;
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
        return this.skew.x === this.skew.y ? this.skew.x : 0.0;
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

    buildLocalMatrix() {
        const x = this.position.x + this.origin.x;
        const y = this.position.y + this.origin.y;
        const xx = -this.origin.x - this.pivot.x;
        const yy = -this.origin.y - this.pivot.y;

        const ra = Math.cos(this.skew.y) * this.scale.x;
        const rb = Math.sin(this.skew.y) * this.scale.x;
        const rc = -Math.sin(this.skew.x) * this.scale.y;
        const rd = Math.cos(this.skew.x) * this.scale.y;

        const m = this.matrix;
        m.a = ra;
        m.b = rb;
        m.c = rc;
        m.d = rd;
        m.x = x + ra * xx + rc * yy;
        m.y = y + rd * yy + rb * xx;

        // this.matrix.set(1, 0, 0, 1,
        //     this.origin.x,
        //     this.origin.y);
        // TMP_MATRIX.setScaleSkew(
        //     this.scale.x,
        //     this.scale.y,
        //     this.skew.x,
        //     this.skew.y,
        // );
        // TMP_MATRIX.x = this.position.x;
        // TMP_MATRIX.y = this.position.y;
        // this.matrix.mult(TMP_MATRIX);
        // this.matrix.translate(-this.origin.x - this.pivot.x, -this.origin.y - this.pivot.y);
        //
        // return this.matrix;
    }

    static globalToLocal(e: Entity, pos: Vec2, out: Vec2) {
        out.copyFrom(pos);
        Transform2D_Data.transformDown(null, e, out);
    }

    static globalToParent(e: Entity, pos: Vec2, out: Vec2) {
        out.copyFrom(pos);
        Transform2D_Data.transformDown(null, e.parent, out);
    }

    static transformUp(it: Entity | null, top: Entity | null, out: Vec2) {
        while (it !== top && it !== null) {
            const transform = it.tryGet(Transform2D);
            if (transform !== undefined) {
                transform.matrix.transformWith(out);
            }
            it = it.parent;
        }
    }

    static transformDown(top: Entity | null, it: Entity | null, out: Vec2) {
        while (it !== top && it !== null) {
            const transform = it.tryGet(Transform2D);
            if (transform !== undefined) {
                transform.matrix.transformInverseWith(out);
            }
            it = it.parent;
        }
    }

    static localToGlobal(e: Entity, pos: Vec2, out: Vec2) {
        out.copyFrom(pos);
        Transform2D_Data.transformUp(e, null, out);
    }

    static parentToGlobal(e: Entity, pos: Vec2, out: Vec2) {
        out.copyFrom(pos);
        Transform2D_Data.transformUp(e.parent, null, out);
    }

    static findDepth(e: Entity): number {
        let depth = 0;
        let it = e.parent;
        while (it !== null) {
            ++depth;
            it = it.parent;
        }
        return depth;
    }

    static findLowerCommonAncestor(e1: Entity, e2: Entity): Entity | null {
        let depth1 = Transform2D_Data.findDepth(e1);
        let depth2 = Transform2D_Data.findDepth(e2);
        let it1: Entity | null = e1;
        let it2: Entity | null = e2;
        while (depth1 > depth2) {
            it1 = it1!.parent;
            --depth1;
        }
        while (depth2 < depth1) {
            it2 = it2!.parent;
            --depth2;
        }
        while (it1 !== it2) {
            it1 = it1!.parent;
            it2 = it2!.parent;
            if (it1 === null || it2 === null) {
                return null;
            }
        }
        return it1;
    }

    static updateLocalMatricesForLink(src: Entity, dest: Entity) {
        const lca = Transform2D_Data.findLowerCommonAncestor(src, dest);
        if (lca !== null) {
            let it: Entity | null = src;
            while (it !== lca && it !== null) {
                const transform = Transform2D.map.get(it.index);
                if (transform !== undefined) {
                    transform.buildLocalMatrix();
                }
                it = it.parent;
            }

            it = dest;
            while (it !== lca && it !== null) {
                const transform = Transform2D.map.get(it.index);
                if (transform !== undefined) {
                    transform.buildLocalMatrix();
                }
                it = it.parent;
            }
        }
    }

    static localToLocal(src: Entity, dest: Entity, pos: Readonly<Vec2>, out: Vec2) {
        out.copyFrom(pos);
        const lca = Transform2D_Data.findLowerCommonAncestor(src, dest);
        if (lca !== null) {
            Transform2D_Data.transformUp(src, lca, out);
            Transform2D_Data.transformDown(lca, dest, out);
        }
    }

    static getTransformationMatrix(src: Entity, dest: Entity, out: Matrix2D) {
        out.copyFrom(Matrix2D.IDENTITY);
        const common = Transform2D_Data.findLowerCommonAncestor(src, dest);
        if (common !== null) {
            let it: Entity | null = dest;
            while (it !== common && it !== null) {
                const transform = it.tryGet(Transform2D);
                if (transform !== undefined) {
                    Matrix2D.multiply(out, transform.matrix, out);
                }
                it = it.parent;
            }
            Matrix2D.inverse(out);
            it = src;
            while (it !== common && it !== null) {
                const transform = it.tryGet(Transform2D);
                if (transform !== undefined) {
                    Matrix2D.multiply(out, transform.matrix, out);
                }
                it = it.parent;
            }
        }
    }

    static calcWorldMatrix(entity: Entity, out: Matrix2D) {
        let it: Entity | null = entity;
        const transformMap = Transform2D.map;
        while (it !== null) {
            const transform = transformMap.get(it.index);
            if (transform !== undefined) {
                Matrix2D.multiply(out, transform.matrix, out);
            }
            it = it.parent;
        }
        if (!Matrix2D.inverse(out)) {
            out.copyFrom(Matrix2D.IDENTITY);
        }
    }
}

export const Transform2D = new PoolComponentType(Transform2D_Data, 1000);