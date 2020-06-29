/**
 * A 2-by-2 matrix. Stored in column-major order.
 */
import {Vec2} from "./Vec2";
import {MathUtil} from "./Math";

export class Mat22 {
    // readonly ex:Vec2
    // readonly ey:Vec2

    // ex.x = a
    // ey.x = b
    // ex.y = c
    // ey.y = d

    constructor(public a: number,
                public b: number,
                public c: number,
                public d: number) {
    }

    static zero() {
        return new Mat22(0, 0, 0, 0);
    }

    toString() {
        return JSON.stringify(this);
    }

    static isValid(o?: Mat22) {
        return o &&
            MathUtil.isFinite(o.a) &&
            MathUtil.isFinite(o.b) &&
            MathUtil.isFinite(o.c) &&
            MathUtil.isFinite(o.d);
    }

    static assert(o?: Mat22) {
        if (!PLANCK_ASSERT) return;
        if (!Mat22.isValid(o)) {
            PLANCK_DEBUG && console.debug(o);
            throw new Error('Invalid Mat22!');
        }
    }

    set(a: number, b: number, c: number, d: number) {
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
    }

    setVec2(ex: Vec2, ey: Vec2) {
        this.a = ex.x;
        this.b = ey.x;
        this.c = ex.y;
        this.d = ey.y;
    }

    copyFrom(m: Mat22) {
        PLANCK_ASSERT && Mat22.assert(m);
        this.a = m.a;
        this.b = m.b;
        this.c = m.c;
        this.d = m.d;
    }

    setIdentity() {
        this.a = 1;
        this.b = 0;
        this.c = 0;
        this.d = 1;
    }

    setZero() {
        this.a = 0;
        this.b = 0;
        this.c = 0;
        this.d = 0;
    }

    getInverse(): Mat22 {
        const a = this.a;
        const b = this.b;
        const c = this.c;
        const d = this.d;
        let det = a * d - b * c;
        if (det !== 0.0) {
            det = 1.0 / det;
        }
        return new Mat22(
            det * d,
            -det * b,
            -det * c,
            det * a
        );
    }

    static _inverse(m: Mat22, out: Mat22) {
        const a = m.a;
        const b = m.b;
        const c = m.c;
        const d = m.d;
        let det = a * d - b * c;
        if (det !== 0.0) {
            det = 1.0 / det;
            // TODO: maybe do not modify here and return failure?
        }
        out.a = det * d;
        out.b = -det * b;
        out.c = -det * c;
        out.d = det * a;
    }

    /**
     * Solve A * x = b, where b is a column vector. This is more efficient than
     * computing the inverse in one-shot cases.
     */
    solve(v: Vec2): Vec2 {
        PLANCK_ASSERT && Vec2.assert(v);
        const a = this.a;
        const b = this.b;
        const c = this.c;
        const d = this.d;
        let det = a * d - b * c;
        if (det !== 0.0) {
            det = 1.0 / det;
        }
        const x = v.x;
        const y = v.y;
        return new Vec2(
            det * (d * x - b * y),
            det * (a * y - c * x)
        );
    }

    /**
     * Multiply a matrix times a vector. If a rotation matrix is provided, then this
     * transforms the vector from one frame to another.
     */
    static mulVec2(m: Mat22, v: Vec2): Vec2 {
        PLANCK_ASSERT && Vec2.assert(v);
        return new Vec2(m.a * v.x + m.b * v.y, m.c * v.x + m.d * v.y);
    }

    static mulMat22(l: Mat22, r: Mat22): Mat22 {
        PLANCK_ASSERT && Mat22.assert(l);
        PLANCK_ASSERT && Mat22.assert(r);
        return new Mat22(
            l.a * r.a + l.b * r.c,
            l.a * r.b + l.b * r.d,
            l.c * r.a + l.d * r.c,
            l.c * r.b + l.d * r.d
        );
    }

    /**
     * Multiply a matrix transpose times a vector. If a rotation matrix is provided,
     * then this transforms the vector from one frame to another (inverse
     * transform).
     */
    static mulTVec2(m: Mat22, v: Vec2) {
        PLANCK_ASSERT && Mat22.assert(m);
        PLANCK_ASSERT && Vec2.assert(v);
        return new Vec2(v.x * m.a + v.y * m.c, v.x * m.b + v.y * m.d);
    }

    static mulTMat22(l: Mat22, r: Mat22) {
        PLANCK_ASSERT && Mat22.assert(l);
        PLANCK_ASSERT && Mat22.assert(r);
        // ex.x = a
        // ey.x = b
        // ex.y = c
        // ey.y = d
        return new Mat22(
            l.a * r.a + l.c * r.c,
            l.a * r.b + l.c * r.d,
            l.b * r.a + l.d * r.c,
            l.b * r.b + l.d * r.d
        );
    }

    static abs(m: Mat22) {
        PLANCK_ASSERT && Mat22.assert(m);
        return new Mat22(
            Math.abs(m.a),
            Math.abs(m.b),
            Math.abs(m.c),
            Math.abs(m.d)
        );
    }

    static add(m1: Mat22, m2: Mat22) {
        PLANCK_ASSERT && Mat22.assert(m1);
        PLANCK_ASSERT && Mat22.assert(m2);
        return new Mat22(
            m1.a + m2.a,
            m1.b + m2.b,
            m1.c + m2.c,
            m1.d + m2.d
        );
    }
}
