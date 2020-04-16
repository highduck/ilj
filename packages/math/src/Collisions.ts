import {Rect} from "./Rect";
import {Vec2} from "./Vec2";
import {Vec3} from "./Vec3";

const EPSILON = 1e-6;

const RC_TMP_0 = new Rect();

const V2_TMP_0 = new Vec2();
const V2_TMP_1 = new Vec2();
const V2_TMP_2 = new Vec2();
const V2_TMP_3 = new Vec2();

const V3_TMP_0 = new Vec3();
const V3_TMP_1 = new Vec3();

export class SweepTestResult {

    // future collision
    ray = false;

    // frame collision
    hit = false;

    // contact normal
    readonly normal = new Vec2();

    // contact position
    readonly contact = new Vec2();

    // normalized time of first collision
    u0 = 0.0;

    // normalized time of second collision
    u1 = 0.0;

    reset() {
        this.ray = false;
        this.hit = false;
        this.normal.set(0, 0);
        this.contact.set(0, 0);
        this.u0 = 0;
        this.u1 = 0;
    }
}

export function distanceToRect(rc: Readonly<Rect>, p: Readonly<Vec2>): number {
    let s = 0.0;
    let d = 0.0;

    if (p.x < rc.x) {
        s = p.x - rc.x;
        d += s * s;
    } else if (p.x > rc.right) {
        s = p.x - rc.right;
        d += s * s;
    }

    if (p.y < rc.y) {
        s = p.y - rc.y;
        d += s * s;
    } else if (p.y > rc.bottom) {
        s = p.y - rc.bottom;
        d += s * s;
    }

    return Math.sqrt(d);
}

export function intersectRayRect(rc: Rect, origin: Vec2, dir: Vec2, result: SweepTestResult): SweepTestResult {
    // reset
    result.reset();
    result.u1 = 1000000.0;

    if (Math.abs(dir.x) < EPSILON) {
        if (origin.x < rc.x || origin.x > rc.right) {
            return result;
        }
    } else {
        const ood = 1.0 / dir.x;
        let t1 = ood * (rc.x - origin.x);
        let t2 = ood * (rc.right - origin.x);
        if (t1 > t2) {
            // swap
            [t1, t2] = [t2, t1];
        }
        result.u0 = Math.max(result.u0, t1);
        result.u1 = Math.min(result.u1, t2);
        if (result.u0 > result.u1) {
            // fail
            return result;
        }
    }

    if (Math.abs(dir.y) < EPSILON) {
        if (origin.y < rc.y || origin.y > rc.bottom) {
            return result;
        }
    } else {
        const ood = 1.0 / dir.y;
        let t1 = ood * (rc.y - origin.y);
        let t2 = ood * (rc.bottom - origin.y);
        if (t1 > t2) {
            // swap
            [t1, t2] = [t2, t1];
        }
        result.u0 = Math.max(result.u0, t1);
        result.u1 = Math.min(result.u1, t2);
        if (result.u0 > result.u1) {
            // fail
            return result;
        }
    }
    result.ray = true;
    result.hit = true;
    // result.contact = origin + dir * result.u0;
    result.contact.copyFrom(origin).addScale(dir, result.u0);
    return result;
}

export function sweepCircles(c0: Readonly<Vec3>, c1: Readonly<Vec3>, delta: Readonly<Vec2>, result: SweepTestResult) {
    // reset
    result.reset();

    const sx = c1.x - c0.x;
    const sy = c1.y - c0.y;
    const r = c1.z + c0.z;
    const c = sx * sx + sy * sy - r * r;
    if (c < 0.0) {
        result.hit = true;
        result.u0 = 0.0;
        return result;
    }
    const a = delta.lengthSqr;
    if (a <= EPSILON) {
        return result;
    }
    const b = delta.x * sx + delta.y * sy; // dot(delta, s)
    if (b >= 0) {
        return result;
    }
    const d = b * b - a * c;
    if (d < 0) {
        return result;
    }
    result.u0 = (-b - Math.sqrt(d)) / a;
    result.hit = true; // result.u0;
    return result;
}

export function sweepRects(a0: Readonly<Rect>,
                           a1: Readonly<Rect>,
                           b0: Readonly<Rect>,
                           b1: Readonly<Rect>,
                           result: SweepTestResult): SweepTestResult {
    result.reset();

    if (a0.overlaps(b0)) {
        result.normal.set(
            a0.centerX < b0.centerX ? 1 : -1,
            a0.centerY < b0.centerY ? 1 : -1,
        );
// 			result.x = a0.centerX + 0.5 * (b0.centerX - a0.centerX);
// 			result.y = a0.centerY + 0.5 * (b0.centerY - a0.centerY);
        result.hit = true;
        return result;
    }

    const dx = (a1.x - a0.x) - (b1.x - b0.x);
    const dy = (a1.y - a0.y) - (b1.y - b0.y);
    let cx0 = b0.x - a0.right;
    let cx1 = b0.right - a0.x;
    let cy0 = b0.y - a0.bottom;
    let cy1 = b0.bottom - a0.y;
    if (dx <= 0) {
        [cx0, cx1] = [cx1, cx0];
    }
    if (dy <= 0) {
        [cy0, cy1] = [cy1, cy0];
    }
    let u0x = 1e5;
    let u1x = -1e5;
    let u0y = 1e5;
    let u1y = -1e5;

    if (dx !== 0.0) {
        u0x = cx0 / dx;
        u1x = cx1 / dx;
    }

    if (dy !== 0.0) {
        u0y = cy0 / dy;
        u1y = cy1 / dy;
    }

    result.u0 = Math.max(u0x, u0y);
    result.u1 = Math.min(u1x, u1y);
    result.ray = result.u0 <= result.u1;
    result.hit = result.ray && (result.u0 <= 1.0) && (result.u0 >= 0.0);

    if (u0x === result.u0) {
        result.normal.x = dx > 0.0 ? 1 : -1;
    }

    if (u0y === result.u0) {
        result.normal.y = dy > 0.0 ? 1 : -1;
    }

    return result;
}

export function sweepCircleRect(circle: Vec3,
                                circleDelta: Vec2,
                                rect: Rect,
                                rectDelta: Vec2,
                                result: SweepTestResult): SweepTestResult {
// TODO: optimize allocation
// 		var e = new rect_f(b.x - r, b.y - r, b.width + r * 2, b.height + r * 2);
// 		var ii = intersectRayRect(e, x, y, dx, dy);
// 		if(!ii.hit) {
// 			return ii;
// 		}
// 		var px = x + dx * ii.u0;
// 		var py = y + dy * ii.u0;
// 		var u = 0;
// 		var v = 0;
// 		if(px < b.x) u |= 1;
// 		if(px > b.right) v |= 1;
// 		if(py < b.y) u |= 2;
// 		if(py > b.bottom) v |= 2;
//
// 		var m = u + v;

    const origin = V2_TMP_0.set(circle.x, circle.y);
    const dir = V2_TMP_1.copyFrom(rectDelta).subtract(circleDelta);
    const dirOpposite = V2_TMP_2.copyFrom(dir).negate();
    const r = circle.z;
    const cp = V2_TMP_3.set(0, 0);
    let corner = false;

    let t0 = 1000000.0;
    const e = RC_TMP_0.set(rect.x - r, rect.y - r, rect.width + r * 2, rect.height + r * 2);

    intersectRayRect(e, origin, dirOpposite, result);
    if (!result.hit) {
        return result;
    }

    e.set(rect.x - r, rect.y, rect.width + r * 2, rect.height);
    intersectRayRect(e, origin, dirOpposite, result);
    if (result.hit && result.u0 <= 1.0) {
        t0 = Math.min(result.u0, t0);
    }

    e.set(rect.x, rect.y - r, rect.width, rect.height + 2 * r);
    intersectRayRect(e, origin, dirOpposite, result);
    if (result.hit && result.u0 <= 1.0) {
        t0 = Math.min(result.u0, t0);
    }

    const originCircle = V3_TMP_0.set(origin.x, origin.y, 0);
    const testCircle = V3_TMP_1.set(rect.x, rect.y, r);
    sweepCircles(originCircle, testCircle, dir, result);
    if (result.hit && result.u0 < t0) {
        t0 = result.u0;
        cp.set(testCircle.x, testCircle.y);
        corner = true;
    }

    sweepCircles(originCircle, testCircle.set(rect.right, rect.y, r), dir, result);
    if (result.hit && result.u0 < t0) {
        t0 = result.u0;
        cp.set(testCircle.x, testCircle.y);
        corner = true;
    }

    sweepCircles(originCircle, testCircle.set(rect.x, rect.bottom, r), dir, result);
    if (result.hit && result.u0 < t0) {
        t0 = result.u0;
        cp.set(testCircle.x, testCircle.y);
        corner = true;
    }

    sweepCircles(originCircle, testCircle.set(rect.right, rect.bottom, r), dir, result);
    if (result.hit && result.u0 < t0) {
        t0 = result.u0;
        cp.set(testCircle.x, testCircle.y);
        corner = true;
    }

    if (t0 <= 1 && t0 >= 0) {
        result.hit = true;
        origin.addScale(circleDelta, t0);
        if (corner) {
            // result.normal = origin - cp - rect_delta * t0;
            result.normal.copyFrom(origin).subtract(cp).addScale(rectDelta, -t0);
        } else {
            // reuse V2_TMP_3
            const b = V2_TMP_3.set(rect.x, rect.y).addScale(rectDelta, t0);
            if (origin.x >= b.x && origin.x <= b.x + rect.width) {
                result.normal.set(0, origin.y <= (b.y + rect.height * 0.5) ? -1 : 1);
            } else if (origin.y <= b.y + rect.height && origin.y >= b.y) {
                result.normal.set(origin.x <= (b.x + rect.width * 0.5) ? -1 : 1, 0);
            }
        }
    } else {
        result.hit = false;
    }
    result.u0 = t0;
    return result;
}

/*** Tests ***/

export function testRectLine(rect: Readonly<Rect>, p0: Readonly<Vec2>, p1: Readonly<Vec2>): boolean {
    // Calculate m and c for the equation for the line (y = mx+c)
    const m = (p1.y - p0.y) / (p1.x - p0.x);
    const c = p0.y - (m * p0.x);

    const r = rect.right;

    // if the line is going up from right to left then the top intersect point is on the left
    let intersectionTop = m * rect.x + c;
    let intersectionBottom = m * r + c;
    if (m <= 0.0) {
        // otherwise it's on the right
        [intersectionTop, intersectionBottom] = [intersectionBottom, intersectionTop];
    }

    // work out the top and bottom extents for the triangle
    const trianglePointTop = p0.y < p1.y ? p0.y : p1.y;
    const trianglePointBottom = p0.y < p1.y ? p1.y : p0.y;

    // and calculate the overlap between those two bounds
    const overlapTop = intersectionTop > trianglePointTop ? intersectionTop : trianglePointTop;
    const overlapBottom = intersectionBottom < trianglePointBottom ? intersectionBottom : trianglePointBottom;

    // (topoverlap<botoverlap) :
    // if the intersection isn't the right way up then we have no overlap

    // (!((botoverlap<t) || (topoverlap>b)) :
    // If the bottom overlap is higher than the top of the rectangle or the top overlap is
    // lower than the bottom of the rectangle we don't have intersection. So return the negative
    // of that. Much faster than checking each of the points is within the bounds of the rectangle.
    return overlapTop < overlapBottom
        && overlapBottom >= rect.y
        && overlapTop <= rect.bottom;
}

export function testRectTriangle(rect: Rect, v0: Vec2, v1: Vec2, v2: Vec2): boolean {
    return testRectLine(rect, v0, v1)
        || testRectLine(rect, v1, v2)
        || testRectLine(rect, v2, v0);
}

export function testLineLine(a: Readonly<Vec2>,
                             b: Readonly<Vec2>,
                             c: Readonly<Vec2>,
                             d: Readonly<Vec2>,
                             segmentMode: boolean,
                             intersection: Vec2): boolean {
    const a1 = b.y - a.y;
    const a2 = d.y - c.y;
    const b1 = a.x - b.x;
    const b2 = c.x - d.x;
    const c1 = b.x * a.y - a.x * b.y;
    const c2 = d.x * c.y - c.x * d.y;

    const D = a1 * b2 - a2 * b1;
    if (D === 0.0) {
        return false;
    }

    const ip = V2_TMP_0.set((b1 * c2 - b2 * c1) / D, (a2 * c1 - a1 * c2) / D);

    if (segmentMode) {
        let len = a.distanceSqr(b);
        if (ip.distanceSqr(b) > len || ip.distanceSqr(a) > len) {
            return false;
        }

        len = c.distanceSqr(d);
        if (ip.distanceSqr(d) > len || ip.distanceSqr(c) > len) {
            return false;
        }
    }

    intersection.copyFrom(ip);
    return true;
}

function sign(p1: Readonly<Vec2>, p2: Readonly<Vec2>, p3: Readonly<Vec2>): number {
    return (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);
}

export function testTrianglePoint(point: Readonly<Vec2>,
                                  v0: Readonly<Vec2>,
                                  v1: Readonly<Vec2>,
                                  v2: Readonly<Vec2>): boolean {
    const m = sign(point, v1, v2) < 0.0;
    return m === (sign(point, v0, v1) < 0.0) && m === (sign(point, v2, v0) < 0.0);
}
