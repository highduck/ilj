import {Vec3} from "./Vec3";
import {Vec2} from "./Vec2";

/**
 * A 3-by-3 matrix. Stored in column-major order.
 */
export class Mat33 {

    constructor(readonly ex: Vec3,
                readonly ey: Vec3,
                readonly ez: Vec3) {

    }

    static zero() {
        return new Mat33(Vec3.zero(), Vec3.zero(), Vec3.zero());
    }

    toString() {
        return JSON.stringify(this);
    }

    static isValid(o?:Mat33) {
        return o && Vec3.isValid(o.ex) && Vec3.isValid(o.ey) && Vec3.isValid(o.ez);
    }

    static assert(o?:Mat33) {
        if (!PLANCK_ASSERT) return;
        if (!Mat33.isValid(o)) {
            PLANCK_DEBUG && console.debug(o);
            throw new Error('Invalid Mat33!');
        }
    }

    /**
     * Set this matrix to all zeros.
     */
    setZero() {
        this.ex.setZero();
        this.ey.setZero();
        this.ez.setZero();
        return this;
    }

    /**
     * Solve A * x = b, where b is a column vector. This is more efficient than
     * computing the inverse in one-shot cases.
     */
    solve33(v: Vec3): Vec3 {
        let det = Vec3.dot(this.ex, Vec3.cross(this.ey, this.ez));
        if (det !== 0.0) {
            det = 1.0 / det;
        }
        return new Vec3(
            det * Vec3.dot(v, Vec3.cross(this.ey, this.ez)),
            det * Vec3.dot(this.ex, Vec3.cross(v, this.ez)),
            det * Vec3.dot(this.ex, Vec3.cross(this.ey, v))
        );
    }

    /**
     * Solve A * x = b, where b is a column vector. This is more efficient than
     * computing the inverse in one-shot cases. Solve only the upper 2-by-2 matrix
     * equation.
     *
     * @param {Vec2} v
     *
     * @returns {Vec2}
     */
    solve22(v: Vec2): Vec2 {
        const a11 = this.ex.x;
        const a12 = this.ey.x;
        const a21 = this.ex.y;
        const a22 = this.ey.y;
        let det = a11 * a22 - a12 * a21;
        if (det !== 0.0) {
            det = 1.0 / det;
        }
        return new Vec2(
            det * (a22 * v.x - a12 * v.y),
            det * (a11 * v.y - a21 * v.x)
        );
    }

    /**
     * Get the inverse of this matrix as a 2-by-2. Returns the zero matrix if
     * singular.
     */
    getInverse22(M: Mat33) {
        const a = this.ex.x;
        const b = this.ey.x;
        const c = this.ex.y;
        const d = this.ey.y;
        let det = a * d - b * c;
        if (det !== 0.0) {
            det = 1.0 / det;
        }
        M.ex.x = det * d;
        M.ey.x = -det * b;
        M.ex.z = 0.0;
        M.ex.y = -det * c;
        M.ey.y = det * a;
        M.ey.z = 0.0;
        M.ez.x = 0.0;
        M.ez.y = 0.0;
        M.ez.z = 0.0;
    }

    /**
     * Get the symmetric inverse of this matrix as a 3-by-3. Returns the zero matrix
     * if singular.
     */
    getSymInverse33(M: Mat33) {
        let det = Vec3.dot(this.ex, Vec3.cross(this.ey, this.ez));
        if (det !== 0.0) {
            det = 1.0 / det;
        }
        const a11 = this.ex.x;
        const a12 = this.ey.x;
        const a13 = this.ez.x;
        const a22 = this.ey.y;
        const a23 = this.ez.y;
        const a33 = this.ez.z;

        M.ex.x = det * (a22 * a33 - a23 * a23);
        M.ex.y = det * (a13 * a23 - a12 * a33);
        M.ex.z = det * (a12 * a23 - a13 * a22);

        M.ey.x = M.ex.y;
        M.ey.y = det * (a11 * a33 - a13 * a13);
        M.ey.z = det * (a13 * a12 - a11 * a23);

        M.ez.x = M.ex.z;
        M.ez.y = M.ey.z;
        M.ez.z = det * (a11 * a22 - a12 * a12);
    }

    /**
     * Multiply a matrix times a vector.
     *
     * @param {Mat33} a
     * @param {Vec3|Vec2} b
     *
     * @returns {Vec3|Vec2}
     */

    static mulVec3(a: Mat33, b: Vec3): Vec3 {
        PLANCK_ASSERT && Mat33.assert(a);
        PLANCK_ASSERT && Vec3.assert(b);
        const x = a.ex.x * b.x + a.ey.x * b.y + a.ez.x * b.z;
        const y = a.ex.y * b.x + a.ey.y * b.y + a.ez.y * b.z;
        const z = a.ex.z * b.x + a.ey.z * b.y + a.ez.z * b.z;
        return new Vec3(x, y, z);
    }

    static mulVec2(a: Mat33, b: Vec2): Vec2 {
        PLANCK_ASSERT && Mat33.assert(a);
        PLANCK_ASSERT && Vec2.assert(b);
        const x = a.ex.x * b.x + a.ey.x * b.y;
        const y = a.ex.y * b.x + a.ey.y * b.y;
        return new Vec2(x, y);
    }

    static add(a: Mat33, b: Mat33) {
        PLANCK_ASSERT && Mat33.assert(a);
        PLANCK_ASSERT && Mat33.assert(b);
        const m = Mat33.zero();
        m.ex.copyFrom(Vec3.add(a.ex, b.ex));
        m.ey.copyFrom(Vec3.add(a.ey, b.ey));
        m.ez.copyFrom(Vec3.add(a.ez, b.ez));
        return m;
    }
}