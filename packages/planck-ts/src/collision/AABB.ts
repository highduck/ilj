import {Vec2} from "../common/Vec2";
import {MathUtil} from "../common/Math";
import {RayCastInput, RayCastOutput} from "./RayCastOptions";

export class AABB {

    lowerBound = Vec2.zero();
    upperBound = Vec2.zero();

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
        const d = Vec2.sub(aabb.upperBound, aabb.lowerBound);
        const valid = d.x >= 0.0 && d.y >= 0.0 && Vec2.isValid(aabb.lowerBound) && Vec2.isValid(aabb.upperBound);
        return valid;
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
        return new Vec2((this.lowerBound.x + this.upperBound.x) * 0.5, (this.lowerBound.y + this.upperBound.y) * 0.5);
    }

    /**
     * Get the extents of the AABB (half-widths).
     */
    getExtents() {
        return new Vec2((this.upperBound.x - this.lowerBound.x) * 0.5, (this.upperBound.y - this.lowerBound.y) * 0.5);
    }

    /**
     * Get the perimeter length.
     */
    getPerimeter() {
        return 2.0 * (this.upperBound.x - this.lowerBound.x + this.upperBound.y - this.lowerBound.y);
    }

    /**
     * Combine one or two AABB into this one.
     */
    combine(a: AABB, b: AABB) {
        //b = b || this;
        const lowerA = a.lowerBound;
        const upperA = a.upperBound;
        const lowerB = b.lowerBound;
        const upperB = b.upperBound;

        const lowerX = Math.min(lowerA.x, lowerB.x);
        const lowerY = Math.min(lowerA.y, lowerB.y);
        const upperX = Math.max(upperB.x, upperA.x);
        const upperY = Math.max(upperB.y, upperA.y);

        this.lowerBound.set(lowerX, lowerY);
        this.upperBound.set(upperX, upperY);
    }

    combinePoints(a:Vec2, b:Vec2) {
        this.lowerBound.set(Math.min(a.x, b.x), Math.min(a.y, b.y));
        this.upperBound.set(Math.max(a.x, b.x), Math.max(a.y, b.y));
    }

    set(aabb: AABB) {
        this.lowerBound.set(aabb.lowerBound.x, aabb.lowerBound.y);
        this.upperBound.set(aabb.upperBound.x, aabb.upperBound.y);
    }

    contains(aabb: AABB) {
        return this.lowerBound.x <= aabb.lowerBound.x &&
            this.lowerBound.y <= aabb.lowerBound.y &&
            aabb.upperBound.x <= this.upperBound.x &&
            aabb.upperBound.y <= this.upperBound.y;
    }

    extend(value: number) {
        AABB.extend(this, value);
        return this;
    }

    static extend(aabb: AABB, value: number) {
        aabb.lowerBound.x -= value;
        aabb.lowerBound.y -= value;
        aabb.upperBound.x += value;
        aabb.upperBound.y += value;
    }

    static testOverlap(a: AABB, b: AABB) {
        const d1x = b.lowerBound.x - a.upperBound.x;
        const d2x = a.lowerBound.x - b.upperBound.x;

        const d1y = b.lowerBound.y - a.upperBound.y;
        const d2y = a.lowerBound.y - b.upperBound.y;

        if (d1x > 0 || d1y > 0 || d2x > 0 || d2y > 0) {
            return false;
        }
        return true;
    }

    static areEqual(a: AABB, b: AABB) {
        return Vec2.areEqual(a.lowerBound, b.lowerBound) && Vec2.areEqual(a.upperBound, b.upperBound);
    }

    static diff(a: AABB, b: AABB) {
        const wD = Math.max(0, Math.min(a.upperBound.x, b.upperBound.x) - Math.max(b.lowerBound.x, a.lowerBound.x))
        const hD = Math.max(0, Math.min(a.upperBound.y, b.upperBound.y) - Math.max(b.lowerBound.y, a.lowerBound.y));

        const wA = a.upperBound.x - a.lowerBound.x;
        const hA = a.upperBound.y - a.lowerBound.y;

        const wB = b.upperBound.x - b.lowerBound.x;
        const hB = b.upperBound.y - b.lowerBound.y;

        return wA * hA + wB * hB - wD * hD;
    };

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
            if (p.x < this.lowerBound.x || this.upperBound.x < p.x) {
                return false;
            }
        } else {
            const inv_d = 1.0 / d.x;
            let t1 = (this.lowerBound.x - p.x) * inv_d;
            let t2 = (this.upperBound.x - p.x) * inv_d;

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
            if (p.y < this.lowerBound.y || this.upperBound.y < p.y) {
                return false;
            }
        } else {
            const inv_d = 1.0 / d.y;
            let t1 = (this.lowerBound.y - p.y) * inv_d;
            let t2 = (this.upperBound.y - p.y) * inv_d;

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