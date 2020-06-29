import {Vec2} from "../common/Vec2";
import {MathUtil} from "../common/Math";
import {RayCastInput, RayCastOutput} from "./RayCastOptions";

export class AABB {

    // lowerBound = Vec2.zero();
    // upperBound = Vec2.zero();
    constructor(public lx: number,
                public ly: number,
                public ux: number,
                public uy: number) {
    }

    static zero(): AABB {
        return new AABB(0, 0, 0, 0);
    }

    // AABB(lower, upper) {
    //     if (!(this instanceof AABB)) {
    //         return new AABB(lower, upper);
    //     }
    //
    //     this.lowerBound = Vec2.zero();
    //     this.upperBound = Vec2.zero();
    //
    //     if (typeof lower === 'object') {
    //         this.lowerBound.set(lower);
    //     }
    //     if (typeof upper === 'object') {
    //         this.upperBound.set(upper);
    //     } else if (typeof lower === 'object') {
    //         this.upperBound.set(lower);
    //     }
    // };

    /**
     * Verify that the bounds are sorted.
     */
    static isValid(aabb: AABB) {
        const finiteValues = MathUtil.isFinite(aabb.lx) &&
            MathUtil.isFinite(aabb.ly) &&
            MathUtil.isFinite(aabb.ux) &&
            MathUtil.isFinite(aabb.uy);
        const validBounds = aabb.ux >= aabb.lx &&
            aabb.uy >= aabb.ly;
        return finiteValues && validBounds;
    }

    static assert(o: AABB) {
        if (!PLANCK_ASSERT) return;
        if (!AABB.isValid(o)) {
            PLANCK_DEBUG && console.debug(o);
            throw new Error('Invalid AABB!');
        }
    }

    /**
     * Get the center of the AABB.
     */
    getCenter() {
        return new Vec2(0.5 * (this.lx + this.ux), 0.5 * (this.ly + this.uy));
    }

    /**
     * Get the extents of the AABB (half-widths).
     */
    getExtents() {
        return new Vec2(0.5 * (this.ux - this.lx), 0.5 * (this.uy - this.ly));
    }

    /**
     * Get the perimeter length.
     */
    getPerimeter() {
        return 2.0 * (this.ux - this.lx + this.uy - this.ly);
    }

    /**
     * Combine one or two AABB into this one.
     */
    combine(a: AABB, b: AABB) {
        const lowerX = Math.min(a.lx, b.lx);
        const lowerY = Math.min(a.ly, b.ly);
        const upperX = Math.max(b.ux, a.ux);
        const upperY = Math.max(b.uy, a.uy);

        this.lx = lowerX;
        this.ly = lowerY;
        this.ux = upperX;
        this.uy = upperY;
    }

    combinePoints(a: Vec2, b: Vec2) {
        this.lx = Math.min(a.x, b.x);
        this.ly = Math.min(a.y, b.y);
        this.ux = Math.max(a.x, b.x);
        this.uy = Math.max(a.y, b.y);
    }

    copyFrom(aabb: AABB) {
        this.lx = aabb.lx;
        this.ly = aabb.ly;
        this.ux = aabb.ux;
        this.uy = aabb.uy;
    }

    contains(aabb: AABB) {
        return this.lx <= aabb.lx &&
            this.ly <= aabb.ly &&
            aabb.ux <= this.ux &&
            aabb.uy <= this.uy;
    }

    extend(value: number) {
        this.lx -= value;
        this.ly -= value;
        this.ux += value;
        this.uy += value;
    }

    static testOverlap(a: AABB, b: AABB):boolean {
        return b.lx <= a.ux && b.ly <= a.uy && a.lx <= b.ux && a.ly <= b.uy;
    }

    static areEqual(a: AABB, b: AABB) {
        return a === b ||
            (a.lx === b.lx &&
                a.ly === b.ly &&
                a.ux === b.ux &&
                a.uy === b.uy);
    }

    static diff(a: AABB, b: AABB) {
        const wD = Math.max(0, Math.min(a.ux, b.ux) - Math.max(b.lx, a.lx))
        const hD = Math.max(0, Math.min(a.uy, b.uy) - Math.max(b.ly, a.ly));
        const wA = a.ux - a.lx;
        const hA = a.uy - a.ly;
        const wB = b.ux - b.lx;
        const hB = b.uy - b.ly;
        return wA * hA + wB * hB - wD * hD;
    }

    /**
     * @param {RayCastOutput} output
     * @param {RayCastInput} input
     * @returns {boolean}
     */
    rayCast(output: RayCastOutput, input: RayCastInput) {
        // From Real-time Collision Detection, p179.

        let tmin = -Infinity;
        let tmax = Infinity;

        let p = input.p1;
        let d = Vec2.sub(input.p2, input.p1);
        let absD = Vec2.abs(d);

        let normal = Vec2.zero();

        if (absD.x < MathUtil.EPSILON) {
            // Parallel.
            if (p.x < this.lx || this.ux < p.x) {
                return false;
            }
        } else {
            const inv_d = 1.0 / d.x;
            let t1 = (this.lx - p.x) * inv_d;
            let t2 = (this.ux - p.x) * inv_d;

            // Sign of the normal vector.
            let s = -1.0;

            if (t1 > t2) {
                const temp = t1;
                t1 = t2;
                t2 = temp;
                s = 1.0;
            }

            // Push the min up
            if (t1 > tmin) {
                normal.x = s;
                normal.y = 0.0;
                tmin = t1;
            }

            // Pull the max down
            tmax = Math.min(tmax, t2);

            if (tmin > tmax) {
                return false;
            }
        }

        if (absD.x < MathUtil.EPSILON) {
            // Parallel.
            if (p.y < this.ly || this.uy < p.y) {
                return false;
            }
        } else {
            const inv_d = 1.0 / d.y;
            let t1 = (this.ly - p.y) * inv_d;
            let t2 = (this.uy - p.y) * inv_d;

            // Sign of the normal vector.
            let s = -1.0;

            if (t1 > t2) {
                const temp = t1;
                t1 = t2;
                t2 = temp;
                s = 1.0;
            }

            // Push the min up
            if (t1 > tmin) {
                normal.x = 0.0;
                normal.y = s;
                tmin = t1;
            }

            // Pull the max down
            tmax = Math.min(tmax, t2);

            if (tmin > tmax) {
                return false;
            }
        }

        // Does the ray start inside the box?
        // Does the ray intersect beyond the max fraction?
        if (tmin < 0.0 || input.maxFraction < tmin) {
            return false;
        }

        // Intersection.
        output.fraction = tmin;
        output.normal = normal;
        return true;
    }

    toString() {
        return JSON.stringify(this);
    }
}