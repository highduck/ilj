import {Vec2} from "../common/Vec2";
import {assert} from "../util/common";
import {Transform} from "../common/Transform";
import {MathUtil} from "../common/Math";
import {Rot} from "../common/Rot";
import {Settings} from "../Settings";
import {Shape} from "../Shape";

/**
 * GJK using Voronoi regions (Christer Ericson) and Barycentric coordinates.
 */
export const GJKStats = {
    calls: 0,
    iters: 0,
    maxIters: 0
};

/**
 * Input for Distance. You have to option to use the shape radii in the
 * computation. Even
 */
export class DistanceInput {
    proxyA = new DistanceProxy();
    proxyB = new DistanceProxy();
    transformA = Transform.identity();
    transformB = Transform.identity();
    useRadii = false;
}

/**
 * Output for Distance.
 *
 * @prop {Vec2} pointA closest point on shapeA
 * @prop {Vec2} pointB closest point on shapeB
 * @prop distance
 * @prop iterations number of GJK iterations used
 */
export class DistanceOutput {
    pointA = Vec2.zero();
    pointB = Vec2.zero();
    distance = 0;
    iterations = 0;
}

/**
 * Used to warm start Distance. Set count to zero on first call.
 *
 * @prop {number} metric length or area
 * @prop {array} indexA vertices on shape A
 * @prop {array} indexB vertices on shape B
 * @prop {number} count
 */

export class SimplexCache {
    metric = 0;
    indexA: number[] = [];
    indexB: number[] = [];
    count = 0;
}

/**
 * Compute the closest points between two shapes. Supports any combination of:
 * CircleShape, PolygonShape, EdgeShape. The simplex cache is input/output. On
 * the first call set SimplexCache.count to zero.
 */
export function Distance(output: DistanceOutput, cache: SimplexCache, input: DistanceInput) {
    ++GJKStats.calls;

    const proxyA = input.proxyA;
    const proxyB = input.proxyB;
    const xfA = input.transformA;
    const xfB = input.transformB;

    // Initialize the simplex.
    const simplex = new Simplex();
    simplex.readCache(cache, proxyA, xfA, proxyB, xfB);

    // Get simplex vertices as an array.
    const vertices = simplex.m_v;// SimplexVertex
    const k_maxIters = Settings.maxDistnceIterations;

    // These store the vertices of the last simplex so that we
    // can check for duplicates and prevent cycling.
    const saveA = [];
    const saveB = []; // int[3]
    let saveCount = 0;

    let distanceSqr1 = Infinity;
    let distanceSqr2 = Infinity;

    // Main iteration loop.
    let iter = 0;
    while (iter < k_maxIters) {
        // Copy simplex so we can identify duplicates.
        saveCount = simplex.m_count;
        for (let i = 0; i < saveCount; ++i) {
            saveA[i] = vertices[i].indexA;
            saveB[i] = vertices[i].indexB;
        }

        simplex.solve();

        // If we have 3 points, then the origin is in the corresponding triangle.
        if (simplex.m_count == 3) {
            break;
        }

        // Compute closest point.
        const p = simplex.getClosestPoint();
        distanceSqr2 = p.lengthSquared();

        // Ensure progress
        if (distanceSqr2 >= distanceSqr1) {
            // break;
        }
        distanceSqr1 = distanceSqr2;

        // Get search direction.
        const d = simplex.getSearchDirection();

        // Ensure the search direction is numerically fit.
        if (d.lengthSquared() < MathUtil.EPSILON * MathUtil.EPSILON) {
            // The origin is probably contained by a line segment
            // or triangle. Thus the shapes are overlapped.

            // We can't return zero here even though there may be overlap.
            // In case the simplex is a point, segment, or triangle it is difficult
            // to determine if the origin is contained in the CSO or very close to it.
            break;
        }

        // Compute a tentative new simplex vertex using support points.
        const vertex = vertices[simplex.m_count]; // SimplexVertex

        vertex.indexA = proxyA.getSupport(Rot.mulTVec2(xfA.q, Vec2.neg(d)));
        vertex.wA = Transform.mulVec2(xfA, proxyA.getVertex(vertex.indexA));

        vertex.indexB = proxyB.getSupport(Rot.mulTVec2(xfB.q, d));
        vertex.wB = Transform.mulVec2(xfB, proxyB.getVertex(vertex.indexB));

        vertex.w = Vec2.sub(vertex.wB, vertex.wA);

        // Iteration count is equated to the number of support point calls.
        ++iter;
        ++GJKStats.iters;

        // Check for duplicate support points. This is the main termination
        // criteria.
        let duplicate = false;
        for (let i = 0; i < saveCount; ++i) {
            if (vertex.indexA == saveA[i] && vertex.indexB == saveB[i]) {
                duplicate = true;
                break;
            }
        }

        // If we found a duplicate support point we must exit to avoid cycling.
        if (duplicate) {
            break;
        }

        // New vertex is ok and needed.
        ++simplex.m_count;
    }

    GJKStats.maxIters = Math.max(GJKStats.maxIters, iter);

    // Prepare output.
    simplex.getWitnessPoints(output.pointA, output.pointB);
    output.distance = Vec2.distance(output.pointA, output.pointB);
    output.iterations = iter;

    // Cache the simplex.
    simplex.writeCache(cache);

    // Apply radii if requested.
    if (input.useRadii) {
        const rA = proxyA.m_radius;
        const rB = proxyB.m_radius;

        if (output.distance > rA + rB && output.distance > MathUtil.EPSILON) {
            // Shapes are still no overlapped.
            // Move the witness points to the outer surface.
            output.distance -= rA + rB;
            const normal = Vec2.sub(output.pointB, output.pointA);
            normal.normalize();
            output.pointA.addMul(rA, normal);
            output.pointB.subMul(rB, normal);
        } else {
            // Shapes are overlapped when radii are considered.
            // Move the witness points to the middle.
            const p = Vec2.mid(output.pointA, output.pointB);
            output.pointA.copyFrom(p);
            output.pointB.copyFrom(p);
            output.distance = 0.0;
        }
    }
}

/**
 * A distance proxy is used by the GJK algorithm. It encapsulates any shape.
 */
export class DistanceProxy {
    m_buffer: Vec2[] = []; // Vec2[2]
    m_vertices: Vec2[] = []; // Vec2[]
    m_count = 0;
    m_radius = 0;

    /**
     * Get the vertex count.
     */
    getVertexCount() {
        return this.m_count;
    }

    /**
     * Get a vertex by index. Used by Distance.
     */
    getVertex(index: number) {
        PLANCK_ASSERT && assert(0 <= index && index < this.m_count);
        return this.m_vertices[index];
    }

    /**
     * Get the supporting vertex index in the given direction.
     */
    getSupport(d: Vec2) {
        let bestIndex = 0;
        let bestValue = Vec2.dot(this.m_vertices[0], d);
        for (let i = 1; i < this.m_count; ++i) {
            const value = Vec2.dot(this.m_vertices[i], d);
            if (value > bestValue) {
                bestIndex = i;
                bestValue = value;
            }
        }
        return bestIndex;
    }

    /**
     * Get the supporting vertex in the given direction.
     */
    getSupportVertex(d: Vec2) {
        return this.m_vertices[this.getSupport(d)];
    }

    /**
     * Initialize the proxy using the given shape. The shape must remain in scope
     * while the proxy is in use.
     */
    set(shape: Shape, index: number) {
        // TODO remove, use shape instead
        //PLANCK_ASSERT && assert(typeof shape.computeDistanceProxy === 'function');
        shape.computeDistanceProxy(this, index);
    }
}

class SimplexVertex {
    indexA = 0; // wA index
    indexB = 0; // wB index
    wA = Vec2.zero(); // support point in proxyA
    wB = Vec2.zero(); // support point in proxyB
    w = Vec2.zero(); // wB - wA
    a = 0; // barycentric coordinate for closest point

    set(v: SimplexVertex) {
        this.indexA = v.indexA;
        this.indexB = v.indexB;
        this.wA.copyFrom(v.wA);
        this.wB.copyFrom(v.wB);
        this.w.copyFrom(v.w);
        this.a = v.a;
    }
}

class Simplex {
    m_v1 = new SimplexVertex();
    m_v2 = new SimplexVertex();
    m_v3 = new SimplexVertex();
    m_v = [this.m_v1, this.m_v2, this.m_v3];
    m_count = 0;

    print() {
        if (this.m_count === 3) {
            return ["+" + this.m_count,
                this.m_v1.a, this.m_v1.wA.x, this.m_v1.wA.y, this.m_v1.wB.x, this.m_v1.wB.y,
                this.m_v2.a, this.m_v2.wA.x, this.m_v2.wA.y, this.m_v2.wB.x, this.m_v2.wB.y,
                this.m_v3.a, this.m_v3.wA.x, this.m_v3.wA.y, this.m_v3.wB.x, this.m_v3.wB.y
            ].toString();

        } else if (this.m_count === 2) {
            return ["+" + this.m_count,
                this.m_v1.a, this.m_v1.wA.x, this.m_v1.wA.y, this.m_v1.wB.x, this.m_v1.wB.y,
                this.m_v2.a, this.m_v2.wA.x, this.m_v2.wA.y, this.m_v2.wB.x, this.m_v2.wB.y
            ].toString();

        } else if (this.m_count === 1) {
            return ["+" + this.m_count,
                this.m_v1.a, this.m_v1.wA.x, this.m_v1.wA.y, this.m_v1.wB.x, this.m_v1.wB.y
            ].toString();

        } else {
            return "+" + this.m_count;
        }
    }

// (SimplexCache, DistanceProxy, ...)
    readCache(cache: SimplexCache,
              proxyA: DistanceProxy, transformA: Transform,
              proxyB: DistanceProxy, transformB: Transform) {

        PLANCK_ASSERT && assert(cache.count <= 3);

        // Copy data from cache.
        this.m_count = cache.count;
        for (let i = 0; i < this.m_count; ++i) {
            const v = this.m_v[i];
            v.indexA = cache.indexA[i];
            v.indexB = cache.indexB[i];
            const wALocal = proxyA.getVertex(v.indexA);
            const wBLocal = proxyB.getVertex(v.indexB);
            v.wA = Transform.mulVec2(transformA, wALocal);
            v.wB = Transform.mulVec2(transformB, wBLocal);
            v.w = Vec2.sub(v.wB, v.wA);
            v.a = 0.0;
        }

        // Compute the new simplex metric, if it is substantially different than
        // old metric then flush the simplex.
        if (this.m_count > 1) {
            const metric1 = cache.metric;
            const metric2 = this.getMetric();
            if (metric2 < 0.5 * metric1 || 2.0 * metric1 < metric2
                || metric2 < MathUtil.EPSILON) {
                // Reset the simplex.
                this.m_count = 0;
            }
        }

        // If the cache is empty or invalid...
        if (this.m_count == 0) {
            const v = this.m_v[0];// SimplexVertex
            v.indexA = 0;
            v.indexB = 0;
            const wALocal = proxyA.getVertex(0);
            const wBLocal = proxyB.getVertex(0);
            v.wA = Transform.mulVec2(transformA, wALocal);
            v.wB = Transform.mulVec2(transformB, wBLocal);
            v.w = Vec2.sub(v.wB, v.wA);
            v.a = 1.0;
            this.m_count = 1;
        }
    }

    writeCache(cache: SimplexCache) {
        cache.metric = this.getMetric();
        cache.count = this.m_count;
        for (let i = 0; i < this.m_count; ++i) {
            cache.indexA[i] = this.m_v[i].indexA;
            cache.indexB[i] = this.m_v[i].indexB;
        }
    }


    getSearchDirection(): Vec2 {
        switch (this.m_count) {
            case 1:
                return Vec2.neg(this.m_v1.w);

            case 2: {
                const e12 = Vec2.sub(this.m_v2.w, this.m_v1.w);
                const sgn = Vec2.cross(e12, Vec2.neg(this.m_v1.w));
                if (sgn > 0.0) {
                    // Origin is left of e12.
                    return Vec2.crossSV(1.0, e12);
                } else {
                    // Origin is right of e12.
                    return Vec2.crossVS(e12, 1.0);
                }
            }

            default:
                PLANCK_ASSERT && assert(false);
                return Vec2.zero();
        }
    }

    getClosestPoint() {
        switch (this.m_count) {
            case 0:
                PLANCK_ASSERT && assert(false);
                return Vec2.zero();

            case 1:
                return Vec2.clone(this.m_v1.w);

            case 2:
                return Vec2.combine(this.m_v1.a, this.m_v1.w, this.m_v2.a, this.m_v2.w);

            case 3:
                return Vec2.zero();

            default:
                PLANCK_ASSERT && assert(false);
                return Vec2.zero();
        }
    }

    getWitnessPoints(pA: Vec2, pB: Vec2) {
        switch (this.m_count) {
            case 0:
                PLANCK_ASSERT && assert(false);
                break;

            case 1:
                pA.copyFrom(this.m_v1.wA);
                pB.copyFrom(this.m_v1.wB);
                break;

            case 2:
                pA.setCombine(this.m_v1.a, this.m_v1.wA, this.m_v2.a, this.m_v2.wA);
                pB.setCombine(this.m_v1.a, this.m_v1.wB, this.m_v2.a, this.m_v2.wB);
                break;

            case 3:
                pA.setCombine(this.m_v1.a, this.m_v1.wA, this.m_v2.a, this.m_v2.wA);
                pA.addMul(this.m_v3.a, this.m_v3.wA);
                pB.copyFrom(pA);
                break;

            default:
                PLANCK_ASSERT && assert(false);
                break;
        }
    }

    getMetric() {
        switch (this.m_count) {
            case 0:
                PLANCK_ASSERT && assert(false);
                return 0.0;

            case 1:
                return 0.0;

            case 2:
                return Vec2.distance(this.m_v1.w, this.m_v2.w);

            case 3:
                return Vec2.cross(Vec2.sub(this.m_v2.w, this.m_v1.w), Vec2.sub(this.m_v3.w,
                    this.m_v1.w));

            default:
                PLANCK_ASSERT && assert(false);
                return 0.0;
        }
    }


    solve() {
        switch (this.m_count) {
            case 1:
                break;

            case 2:
                this.solve2();
                break;

            case 3:
                this.solve3();
                break;

            default:
                PLANCK_ASSERT && assert(false);
        }
    }

// Solve a line segment using barycentric coordinates.
//
// p = a1 * w1 + a2 * w2
// a1 + a2 = 1
//
// The vector from the origin to the closest point on the line is
// perpendicular to the line.
// e12 = w2 - w1
// dot(p, e) = 0
// a1 * dot(w1, e) + a2 * dot(w2, e) = 0
//
// 2-by-2 linear system
// [1 1 ][a1] = [1]
// [w1.e12 w2.e12][a2] = [0]
//
// Define
// d12_1 = dot(w2, e12)
// d12_2 = -dot(w1, e12)
// d12 = d12_1 + d12_2
//
// Solution
// a1 = d12_1 / d12
// a2 = d12_2 / d12
    solve2() {
        const w1 = this.m_v1.w;
        const w2 = this.m_v2.w;
        const e12 = Vec2.sub(w2, w1);

        // w1 region
        const d12_2 = -Vec2.dot(w1, e12);
        if (d12_2 <= 0.0) {
            // a2 <= 0, so we clamp it to 0
            this.m_v1.a = 1.0;
            this.m_count = 1;
            return;
        }

        // w2 region
        const d12_1 = Vec2.dot(w2, e12);
        if (d12_1 <= 0.0) {
            // a1 <= 0, so we clamp it to 0
            this.m_v2.a = 1.0;
            this.m_count = 1;
            this.m_v1.set(this.m_v2);
            return;
        }

        // Must be in e12 region.
        const inv_d12 = 1.0 / (d12_1 + d12_2);
        this.m_v1.a = d12_1 * inv_d12;
        this.m_v2.a = d12_2 * inv_d12;
        this.m_count = 2;
    }

// Possible regions:
// - points[2]
// - edge points[0]-points[2]
// - edge points[1]-points[2]
// - inside the triangle

    solve3() {
        const w1 = this.m_v1.w;
        const w2 = this.m_v2.w;
        const w3 = this.m_v3.w;

        // Edge12
        // [1 1 ][a1] = [1]
        // [w1.e12 w2.e12][a2] = [0]
        // a3 = 0
        const e12 = Vec2.sub(w2, w1);
        const w1e12 = Vec2.dot(w1, e12);
        const w2e12 = Vec2.dot(w2, e12);
        const d12_1 = w2e12;
        const d12_2 = -w1e12;

        // Edge13
        // [1 1 ][a1] = [1]
        // [w1.e13 w3.e13][a3] = [0]
        // a2 = 0
        const e13 = Vec2.sub(w3, w1);
        const w1e13 = Vec2.dot(w1, e13);
        const w3e13 = Vec2.dot(w3, e13);
        const d13_1 = w3e13;
        const d13_2 = -w1e13;

        // Edge23
        // [1 1 ][a2] = [1]
        // [w2.e23 w3.e23][a3] = [0]
        // a1 = 0
        const e23 = Vec2.sub(w3, w2);// Vec2
        const w2e23 = Vec2.dot(w2, e23);
        const w3e23 = Vec2.dot(w3, e23);
        const d23_1 = w3e23;
        const d23_2 = -w2e23;

        // Triangle123
        const n123 = Vec2.cross(e12, e13);

        const d123_1 = n123 * Vec2.cross(w2, w3);
        const d123_2 = n123 * Vec2.cross(w3, w1);
        const d123_3 = n123 * Vec2.cross(w1, w2);

        // w1 region
        if (d12_2 <= 0.0 && d13_2 <= 0.0) {
            this.m_v1.a = 1.0;
            this.m_count = 1;
            return;
        }

        // e12
        if (d12_1 > 0.0 && d12_2 > 0.0 && d123_3 <= 0.0) {
            const inv_d12 = 1.0 / (d12_1 + d12_2);
            this.m_v1.a = d12_1 * inv_d12;
            this.m_v2.a = d12_2 * inv_d12;
            this.m_count = 2;
            return;
        }

        // e13
        if (d13_1 > 0.0 && d13_2 > 0.0 && d123_2 <= 0.0) {
            const inv_d13 = 1.0 / (d13_1 + d13_2);
            this.m_v1.a = d13_1 * inv_d13;
            this.m_v3.a = d13_2 * inv_d13;
            this.m_count = 2;
            this.m_v2.set(this.m_v3);
            return;
        }

        // w2 region
        if (d12_1 <= 0.0 && d23_2 <= 0.0) {
            this.m_v2.a = 1.0;
            this.m_count = 1;
            this.m_v1.set(this.m_v2);
            return;
        }

        // w3 region
        if (d13_1 <= 0.0 && d23_1 <= 0.0) {
            this.m_v3.a = 1.0;
            this.m_count = 1;
            this.m_v1.set(this.m_v3);
            return;
        }

        // e23
        if (d23_1 > 0.0 && d23_2 > 0.0 && d123_1 <= 0.0) {
            const inv_d23 = 1.0 / (d23_1 + d23_2);
            this.m_v2.a = d23_1 * inv_d23;
            this.m_v3.a = d23_2 * inv_d23;
            this.m_count = 2;
            this.m_v1.set(this.m_v3);
            return;
        }

        // Must be in triangle123
        const inv_d123 = 1.0 / (d123_1 + d123_2 + d123_3);
        this.m_v1.a = d123_1 * inv_d123;
        this.m_v2.a = d123_2 * inv_d123;
        this.m_v3.a = d123_3 * inv_d123;
        this.m_count = 3;
    }
}

/**
 * Determine if two generic shapes overlap.
 */
export function testOverlap(shapeA: Shape, indexA: number,
                            shapeB: Shape, indexB: number,
                            xfA: Transform, xfB: Transform) {
    const input = new DistanceInput();
    input.proxyA.set(shapeA, indexA);
    input.proxyB.set(shapeB, indexB);
    input.transformA = xfA;
    input.transformB = xfB;
    input.useRadii = true;

    const cache = new SimplexCache();

    const output = new DistanceOutput();
    Distance(output, cache, input);

    return output.distance < 10.0 * MathUtil.EPSILON;
}