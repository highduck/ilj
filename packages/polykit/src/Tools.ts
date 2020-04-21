interface Vector2 {
    x: number;
    y: number;
}

type Poly = Vector2[];

// used internally
const POINT: Vector2 = {x: 0, y: 0};

/** Converts a poly defined by an Array<HxPoint> to an Array<Float> (appending values to `out` if specified). */
function toFloatArray(poly: Poly, out?: number[]): number[] {
    out = out ?? [];

    for (const p of poly) {
        out.push(p.x);
        out.push(p.y);
    }

    return out;
}

/** Reverses the coords of the 2D float array `poly` */
function reverseFloatArray(poly: number[]): number[] {
    const result = [];
    const nPoints = poly.length >> 1;
    for (let i = 0; i < nPoints; ++i) {
        const xPos = (nPoints - i - 1) << 1;
        result[i >>> 1] = poly[xPos];
        result[(i >>> 1) + 1] = poly[xPos + 1];
    }
    return result;
}

/** Converts an Array of Arrays into a 'flattened' Array (appending values to `out` if specified). */
function flatten<T>(array: T[][], out?: T[]): T[] {
    const result: T[] = out ? out : [];

    for (const arr of array) {
        for (const item of arr) {
            result.push(item);
        }
    }

    return result;
}

/**
 * Assuming the polygon is simple (not self-intersecting), checks if it is convex.
 **/
function isConvex(poly: Poly): boolean {
    let isPositive: boolean | null = null;

    for (let i = 0; i < poly.length; ++i) {
        const lower = (i == 0 ? poly.length - 1 : i - 1);
        const middle = i;
        const upper = (i == poly.length - 1 ? 0 : i + 1);
        const dx0 = poly[middle].x - poly[lower].x;
        const dy0 = poly[middle].y - poly[lower].y;
        const dx1 = poly[upper].x - poly[middle].x;
        const dy1 = poly[upper].y - poly[middle].y;
        const cross = dx0 * dy1 - dx1 * dy0;

        // cross product should have same sign
        // for each vertex if poly is convex.
        const newIsPositive = cross > 0;

        if (cross == 0) {
            // handle collinear case
            continue;
        }

        if (isPositive == null) {
            isPositive = newIsPositive;
        } else if (isPositive != newIsPositive) {
            return false;
        }
    }

    return true;
}

/** Squared distance from `v` to `w`. */
function distanceSquared(v: Vector2, w: Vector2): number {
    return (v.x - w.x) * (v.x - w.x) + (v.y - w.y) * (v.y - w.y);
}

/** Squared perpendicular distance from `p` to line segment `v`-`w`. */
function distanceToSegmentSquared(p: Vector2, v: Vector2, w: Vector2): number {
    const l2 = distanceSquared(v, w);
    if (l2 == 0) {
        return distanceSquared(p, v);
    }
    const t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    if (t < 0) {
        return distanceSquared(p, v);
    }
    if (t > 1) {
        return distanceSquared(p, w);
    }
    POINT.x = v.x + t * (w.x - v.x);
    POINT.y = v.y + t * (w.y - v.y);
    return distanceSquared(p, POINT);
}

/** Perpendicular distance from `p` to line segment `v`-`w`. */
function distanceToSegment(p: Vector2, v: Vector2, w: Vector2): number {
    return Math.sqrt(distanceToSegmentSquared(p, v, w));
}
