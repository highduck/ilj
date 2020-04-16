type Edge = number;
type Point = number;
type Tri = number;
type Orientation = Uint8Array | null;

type TAConstructor<T> = new(length: number) => T;

interface TA<T> {
    set(s: T): void;
}

function resizeTypedArray<T extends TA<T>>(type: TAConstructor<T>, arr: T, newLength: number): T {
    const n: T = new type(newLength);
    n.set(arr);
    return n;
}

const kAlpha = 0.3;
const EPSILON = 1e-12;
const PI_2 = Math.PI / 2;
const PI_3div4 = 3 * Math.PI / 4;

const TRIANGLES_ARRAY: Tri[] = [];

const COLLINEAR = null;
const CW = new Uint8Array([1, 2, 0, 2, 0, 1]);
const CCW = new Uint8Array([2, 0, 1, 1, 2, 0]);

let Point_ID = 0;
let Point_X: Float32Array;
let Point_Y: Float32Array;
/// The edges this point constitutes an upper ending point
let Point_EDGE: Uint16Array;
let Edge_ID = 1;
let Edge_P: Uint16Array;
let Edge_NEXT: Uint16Array;
let Tri_ID = 1;
let Tri_POINTS: Uint16Array;
let Tri_NEIGHBORS: Uint16Array;
let Tri_FLAGS: Uint8Array;

function initPools(max: number) {
    Point_ID = 0;
    Point_X = new Float32Array(max);
    Point_Y = new Float32Array(max);
    Point_EDGE = new Uint16Array(max);

    Edge_ID = 1;
    Edge_P = new Uint16Array(max);
    Edge_NEXT = new Uint16Array(max);

    Tri_ID = 1;
    Tri_POINTS = new Uint16Array(max * 3);
    Tri_NEIGHBORS = new Uint16Array(max * 3);
    Tri_FLAGS = new Uint8Array(max * 3);
}

function resizePools(max: number) {
    Point_X = resizeTypedArray(Float32Array, Point_X, max);
    Point_Y = resizeTypedArray(Float32Array, Point_Y, max);
    Point_EDGE = resizeTypedArray(Uint16Array, Point_EDGE, max);

    Edge_P = resizeTypedArray(Uint16Array, Edge_P, max);
    Edge_NEXT = resizeTypedArray(Uint16Array, Edge_NEXT, max);

    Tri_POINTS = resizeTypedArray(Uint16Array, Tri_POINTS, max * 3);
    Tri_NEIGHBORS = resizeTypedArray(Uint16Array, Tri_NEIGHBORS, max * 3);
    Tri_FLAGS = resizeTypedArray(Uint8Array, Tri_FLAGS, max * 3);

    console.warn("RESIZE to " + max);
}

function newPoint(x: number, y: number): Point {
    const i = Point_ID++;
    if (i == Point_X.length) {
        resizePools(i << 1);
    }
    Point_X[i] = x;
    Point_Y[i] = y;
    Point_EDGE[i] = 0;

    return i;
}

function newEdge(p1: Point, p2: Point): Edge {
    const edge = Edge_ID++;
    if (edge == Edge_P.length) {
        resizePools(edge << 1);
    }
    let swap = false;

    const y1 = Point_Y[p1];
    const y2 = Point_Y[p2];
    if (y1 > y2) {
        swap = true;
    } else if (y1 == y2) {
        const x1 = Point_X[p1];
        const x2 = Point_X[p2];
        swap = x1 > x2;
        if (x1 == x2) {
            throw new Error("Edge::repeat points " + p1);
        }
    }

    if (swap) {
        const s = p2;
        p2 = p1;
        p1 = s; // p2 == Q
    }

    Edge_P[edge] = p1;
    Edge_NEXT[edge] = Point_EDGE[p2];
    Point_EDGE[p2] = edge;
    return edge;
}

// Has this triangle been marked as an interior triangle?
const MASK_INTERIOR = 0x40;

// Flags to determine if an edge is a Constrained edge
const MASK_CONSTRAINED_EDGE_0 = 0x1;
const MASK_CONSTRAINED_EDGE_1 = 0x2;
const MASK_CONSTRAINED_EDGE_2 = 0x4;

// Flags to determine if an edge is a Delaunay edge
const MASK_DELAUNAY_EDGE_0 = 0x8;
const MASK_DELAUNAY_EDGE_1 = 0x10;
const MASK_DELAUNAY_EDGE_2 = 0x20;

const MASK_EDGES_0 = MASK_CONSTRAINED_EDGE_0 | MASK_DELAUNAY_EDGE_0;

function newTriangle(p1: Point, p2: Point, p3: Point): Tri {
    const i = Tri_ID;
    Tri_ID += 3;
    if (i >= Tri_POINTS.length) {
        resizePools(Tri_ID << 1);
    }

    Tri_POINTS[i] = p1;
    Tri_POINTS[i + 1] = p2;
    Tri_POINTS[i + 2] = p3;
    Tri_NEIGHBORS[i] = 0;
    Tri_NEIGHBORS[i + 1] = 0;
    Tri_NEIGHBORS[i + 2] = 0;
    Tri_FLAGS[i] = 0;
    return i;
}

function markNeighborTriangle(t: Tri, that: Tri) {
    const p0 = Tri_POINTS[t];
    const p1 = Tri_POINTS[t + 1];
    const p2 = Tri_POINTS[t + 2];
    const _0 = Tri_POINTS[that];
    const _1 = Tri_POINTS[that + 1];
    const _2 = Tri_POINTS[that + 2];

    if ((p1 == _2 && p2 == _1) || (p1 == _1 && p2 == _2)) {
        Tri_NEIGHBORS[t] = that;
        Tri_NEIGHBORS[that] = t;
    } else if ((p1 == _0 && p2 == _2) || (p1 == _2 && p2 == _0)) {
        Tri_NEIGHBORS[t] = that;
        Tri_NEIGHBORS[that + 1] = t;
    } else if ((p1 == _0 && p2 == _1) || (p1 == _1 && p2 == _0)) {
        Tri_NEIGHBORS[t] = that;
        Tri_NEIGHBORS[that + 2] = t;
    } else if ((p0 == _2 && p2 == _1) || (p0 == _1 && p2 == _2)) {
        Tri_NEIGHBORS[t + 1] = that;
        Tri_NEIGHBORS[that] = t;
    } else if ((p0 == _0 && p2 == _2) || (p0 == _2 && p2 == _0)) {
        Tri_NEIGHBORS[t + 1] = that;
        Tri_NEIGHBORS[that + 1] = t;
    } else if ((p0 == _0 && p2 == _1) || (p0 == _1 && p2 == _0)) {
        Tri_NEIGHBORS[t + 1] = that;
        Tri_NEIGHBORS[that + 2] = t;
    } else if ((p0 == _2 && p1 == _1) || (p0 == _1 && p1 == _2)) {
        Tri_NEIGHBORS[t + 2] = that;
        Tri_NEIGHBORS[that] = t;
    } else if ((p0 == _0 && p1 == _2) || (p0 == _2 && p1 == _0)) {
        Tri_NEIGHBORS[t + 2] = that;
        Tri_NEIGHBORS[that + 1] = t;
    } else if ((p0 == _0 && p1 == _1) || (p0 == _1 && p1 == _0)) {
        Tri_NEIGHBORS[t + 2] = that;
        Tri_NEIGHBORS[that + 2] = t;
    }
}

function findPointCCW(t: Tri, p: Point): number {
    if (Tri_POINTS[t] == p) { return 2; }
    if (Tri_POINTS[t + 1] == p) { return 0; }
    if (Tri_POINTS[t + 2] == p) { return 1; }
    return -1;
}

function findPoint(t: Tri, p: Point): number {
    if (Tri_POINTS[t] == p) { return 0; }
    if (Tri_POINTS[t + 1] == p) { return 1; }
    if (Tri_POINTS[t + 2] == p) { return 2; }
    return -1;
}

/**
 * Legalize triangle by rotating clockwise.<br>
 * This method takes either 1 parameter (then the triangle is rotated around
 * points(0)) or 2 parameters (then the triangle is rotated around the first
 * parameter).
 */

function legalizeByIndex(i: number, ccw: number, cw: number, point: Point) {
    Tri_POINTS[cw] = Tri_POINTS[i];
    Tri_POINTS[i] = Tri_POINTS[ccw];
    Tri_POINTS[ccw] = point;
}

function findEdge(t: Tri, p1: Point, p2: Point): number {
    const _0 = Tri_POINTS[t];
    if (p1 == _0) {
        if (p2 == Tri_POINTS[t + 1]) { return 2; }
        if (p2 == Tri_POINTS[t + 2]) { return 1; }
        return -1;
    }

    const _1 = Tri_POINTS[t + 1];
    if (p1 == _1) {
        if (p2 == Tri_POINTS[t + 2]) { return 0; }
        if (p2 == _0) { return 2; }
        return -1;
    }

    if (p1 == Tri_POINTS[t + 2]) {
        if (p2 == _0) { return 1; }
        if (p2 == _1) { return 0; }
    }
    return -1;
}

/**
 * Mark an edge of this triangle as constrained.<br>
 * This method takes either 1 parameter (an edge index or an Edge instance) or
 * 2 parameters (two Point instances defining the edge of the triangle).
 */
function markConstrainedEdgeByIndex(t: Tri, index: number) {
    Tri_FLAGS[t] = Tri_FLAGS[t] | (1 << index);
}

function markDelaunayEdgeByIndex(t: Tri, index: number) {
    Tri_FLAGS[t] = Tri_FLAGS[t] | (MASK_DELAUNAY_EDGE_0 << index);
}

function removeDelaunayEdgeByIndex(t: Tri, index: number) {
    // remove
    Tri_FLAGS[t] = Tri_FLAGS[t] & ~(MASK_DELAUNAY_EDGE_0 << index);
}

function markConstrainedEdgeByPoints(t: Tri, p: Point, q: Point) {
    const _0 = Tri_POINTS[t];
    const _1 = Tri_POINTS[t + 1];
    if ((q == _0 && p == _1) || (q == _1 && p == _0)) {
        Tri_FLAGS[t] = Tri_FLAGS[t] | MASK_CONSTRAINED_EDGE_2;
        return;
    }
    const _2 = Tri_POINTS[t + 2];
    if ((q == _0 && p == _2) || (q == _2 && p == _0)) {
        Tri_FLAGS[t] = Tri_FLAGS[t] | MASK_CONSTRAINED_EDGE_1;
        return;
    }

    if ((q == _1 && p == _2) || (q == _2 && p == _1)) {
        Tri_FLAGS[t] = Tri_FLAGS[t] | MASK_CONSTRAINED_EDGE_0;
    }
}

/**
 * Checks if a side from this triangle is an edge side.
 * If sides are not marked they will be marked.
 *
 * @param  t
 * @param    ep
 * @param    eq
 * @return
 */
function isEdgeSide(t: Tri, ep: Point, eq: Point): boolean {
    const index = findEdge(t, ep, eq);
    if (index == -1) {
        return false;
    }

    markConstrainedEdgeByIndex(t, index);
    const that: Tri = Tri_NEIGHBORS[t + index];
    if (that != 0) {
        markConstrainedEdgeByPoints(that, ep, eq);
    }
    return true;
}

function clearDelaunayEdges(t: Tri) {
    // FLAGS[this + 1] = 0;
    Tri_FLAGS[t] = Tri_FLAGS[t] & ~(MASK_DELAUNAY_EDGE_0 | MASK_DELAUNAY_EDGE_1 | MASK_DELAUNAY_EDGE_2);
}

class PNode {

    prev: PNode | null = null;
    next: PNode | null = null;
    x: number;
    y: number;

    constructor(public point: Point, public triangle: Tri) {
        this.x = Point_X[point];
        this.y = Point_Y[point];
    }

    /**
     * this - middle node
     * @return the angle between 3 front nodes
     */
    getHoleAngle(): number {
        /* Complex plane
         * ab = cosA +i*sinA
         * ab = (ax + ay*i)(bx + by*i) = (ax*bx + ay*by) + i(ax*by-ay*bx)
         * atan2(y,x) computes the principal value of the argument function
         * applied to the complex number x+iy
         * Where x = ax*bx + ay*by
         *       y = ax*by - ay*bx
         */

        if (!this.next || !this.prev) {
            throw new Error("assert");
        }
        const ax = this.next.x - this.x;
        const ay = this.next.y - this.y;
        const bx = this.prev.x - this.x;
        const by = this.prev.y - this.y;
        return Math.atan2(
            ax * by - ay * bx,
            ax * bx + ay * by,
        );
    }

    getBasinAngle(): number {
        if (!this.next || !this.next.next) {
            throw new Error("assert");
        }
        return Math.atan2(
            this.y - this.next.next.y, // ay
            this.x - this.next.next.x, // ax
        );
    }
}

/** UTILITIES **/

/**
 * <b>Requirement</b>:<br>
 * 1. a, b and c form a Tri_<br>
 * 2. a and d is know to be on opposite side of bc<br>
 * <pre>
 *                a
 *                +
 *               / \
 *              /   \
 *            b/     \c
 *            +-------+
 *           /    d    \
 *          /           \
 * </pre>
 * <b>Fact</b>: d has to be in area B to have a chance to be inside the circle formed by
 *  a,b and c<br>
 *  d is outside B if orient2d(a,b,d) or orient2d(c,a,d) is CW<br>
 *  This preknowledge gives us a way to optimize the incircle test
 * @param pa - triangle point, opposite d
 * @param pb - triangle point
 * @param pc - triangle point
 * @param pd - point opposite a
 * @return true if d is inside circle, false if on circle edge
 */
function insideIncircle(pa: Point, pb: Point, pc: Point, pd: Point): boolean {
    const adx = Point_X[pa] - Point_X[pd];
    const ady = Point_Y[pa] - Point_Y[pd];
    const bdx = Point_X[pb] - Point_X[pd];
    const bdy = Point_Y[pb] - Point_Y[pd];

    const oabd = adx * bdy - bdx * ady;

    if (oabd <= 0) {
        return false;
    }

    const cdx = Point_X[pc] - Point_X[pd];
    const cdy = Point_Y[pc] - Point_Y[pd];

    const ocad = cdx * ady - adx * cdy;

    if (ocad <= 0) {
        return false;
    }

    return (adx * adx + ady * ady) * (bdx * cdy - cdx * bdy)
        + (bdx * bdx + bdy * bdy) * ocad
        + (cdx * cdx + cdy * cdy) * oabd > 0;
}

function inScanArea(pa: Point, pb: Point, pc: Point, pd: Point): boolean {
    const pdx = Point_X[pd];
    const pdy = Point_Y[pd];
    const adx = Point_X[pa] - pdx;
    const ady = Point_Y[pa] - pdy;
    const bdx = Point_X[pb] - pdx;
    const bdy = Point_Y[pb] - pdy;

    if (adx * bdy - bdx * ady <= EPSILON) {
        return false;
    }

    const cdx = Point_X[pc] - pdx;
    const cdy = Point_Y[pc] - pdy;

    return cdx * ady - adx * cdy > EPSILON;
}

function orient2d(pa: Point, pb: Point, pc: Point): Orientation {
    const val = (Point_X[pa] - Point_X[pc]) * (Point_Y[pb] - Point_Y[pc])
        - (Point_Y[pa] - Point_Y[pc]) * (Point_X[pb] - Point_X[pc]);
    return val >= EPSILON ? CCW : (val <= -EPSILON ? CW : COLLINEAR);
}

function nextFlipPointIndex(ep: Point, eq: Point, ot: Tri, op: Point, oi: number): number {
    return orient2d(eq, op, ep)![oi];
}

/**
 * Rotates a triangle pair one vertex CW
 *<pre>
 *       n2                    n2
 *  P +-----+             P +-----+
 *    | t  /|               |\  t |
 *    |   / |               | \   |
 *  n1|  /  |n3           n1|  \  |n3
 *    | /   |    after CW   |   \ |
 *    |/ oT |               | oT \|
 *    +-----+ oP            +-----+
 *       n4                    n4
 * </pre>
 */
function rotateTrianglePairFromIndices(t: Tri, p: Point, i: number, ot: Tri, op: Point, oi: number) {
    const ccw_i = CCW[i];
    const ccw_oi = CCW[oi];
    const cw_i = CW[i];
    const cw_oi = CW[oi];

    legalizeByIndex(t + i, t + ccw_i, t + cw_i, op);
    // t -> p = cw_i
    // t -> op = ccw_i
    legalizeByIndex(ot + oi, ot + ccw_oi, ot + cw_oi, p);
    // ot -> op = cw_oi
    // ot -> p = ccw_oi

    const e1 = (Tri_FLAGS[t] & (MASK_EDGES_0 << ccw_i)) >>> ccw_i;
    const e2 = (Tri_FLAGS[t] & (MASK_EDGES_0 << cw_i)) >>> cw_i;
    const e3 = (Tri_FLAGS[ot] & (MASK_EDGES_0 << ccw_oi)) >>> ccw_oi;
    const e4 = (Tri_FLAGS[ot] & (MASK_EDGES_0 << cw_oi)) >>> cw_oi;

    let j = CCW[ccw_oi];
    Tri_FLAGS[ot] = (Tri_FLAGS[ot] & ~(MASK_EDGES_0 << j)) | e1 << j;
    j = CW[cw_i];
    Tri_FLAGS[t] = (Tri_FLAGS[t] & ~(MASK_EDGES_0 << j)) | e2 << j;
    j = CCW[ccw_i];
    Tri_FLAGS[t] = (Tri_FLAGS[t] & ~(MASK_EDGES_0 << j)) | e3 << j;
    j = CW[cw_oi];
    Tri_FLAGS[ot] = (Tri_FLAGS[ot] & ~(MASK_EDGES_0 << j)) | e4 << j;

    // Remap neighbors
    // XXX: might optimize the markNeighbor by keeping track of
    //      what side should be assigned to what neighbor after the
    //      rotation. Now mark neighbor does lots of testing to find
    //      the right side.
    const n1 = Tri_NEIGHBORS[t + ccw_i];
    const n2 = Tri_NEIGHBORS[t + cw_i];
    const n3 = Tri_NEIGHBORS[ot + ccw_oi];
    const n4 = Tri_NEIGHBORS[ot + cw_oi];

    Tri_NEIGHBORS[t] = 0;
    Tri_NEIGHBORS[t + 1] = 0;
    Tri_NEIGHBORS[t + 2] = 0;
    Tri_NEIGHBORS[ot] = 0;
    Tri_NEIGHBORS[ot + 1] = 0;
    Tri_NEIGHBORS[ot + 2] = 0;

    if (n1 != 0) { markNeighborTriangle(ot, n1); }
    if (n2 != 0) { markNeighborTriangle(t, n2); }
    if (n3 != 0) { markNeighborTriangle(t, n3); }
    if (n4 != 0) { markNeighborTriangle(ot, n4); }
    markNeighborTriangle(t, ot);
}

function cmpPoints(l: Point, r: Point) {
    const ret: number = Point_Y[l] - Point_Y[r];
    return ret != 0 ? ret : (Point_X[l] - Point_X[r]);
}

class Triangulator {
    /*
     * Inital triangle factor, seed triangle will extend 30% of
     * PointSet width to both left and right.
     */

    _inputPoints: Point[] = [];
    _triangles: Tri[] = [];
    _points: Uint16Array;

    _head: Point;
    _tail: Point;

    _edge_event_constrained_edge_p: Point = 0;
    _edge_event_constrained_edge_q: Point = 0;

    /** advancing front **/
    _front_head: PNode;
    _front_tail: PNode;
    _front_search_node: PNode;

    constructor(points: number[], edges: number[]) {
        initPools(256);
        for (let i = 0; i < points.length; i += 2) {
            this._inputPoints.push(newPoint(points[i], points[i + 1]));
        }
        for (let i = 0; i < edges.length; i += 2) {
            newEdge(this._inputPoints[edges[i]], this._inputPoints[edges[i + 1]]);
        }

        // this.initTriangulation();
        {
            // OPT
            let xmin = Point_X[this._inputPoints[0]];
            let xmax = xmin;
            let ymin = Point_Y[this._inputPoints[0]];
            let ymax = ymin;

            // Calculate bounds
            for (const p of this._inputPoints) {
                const x = Point_X[p];
                const y = Point_Y[p];
                if (x > xmax) { xmax = x; }
                if (x < xmin) { xmin = x; }
                if (y > ymax) { ymax = y; }
                if (y < ymin) { ymin = y; }
            }

            const dx = kAlpha * (xmax - xmin);
            const dy = kAlpha * (ymax - ymin);

            this._head = newPoint(xmax + dx, ymin - dy);
            this._tail = newPoint(xmin - dy, ymin - dy);

            // Sort points along y-axis
            this._inputPoints.sort(cmpPoints);
            this._points = new Uint16Array(this._inputPoints);
        }

        // this.createAdvancingFront()
        {
            // Initial triangle
            const triangle = newTriangle(this._points[0], this._tail, this._head);
            const middle = new PNode(Tri_POINTS[triangle], triangle);

            this._front_head = new PNode(this._tail, triangle);
            this._front_head.next = middle;
            middle.prev = this._front_head;

            this._front_tail = new PNode(this._head, 0);
            this._front_tail.prev = middle;
            middle.next = this._front_tail;

            this._front_search_node = this._front_head;
        }
        // this.sweepPoints();
        // Sweep points; build mesh
        {
            for (let i = 1; i < this._points.length; ++i) {
                const point = this._points[i];
                const node = this.pointEvent(point);
                let edge = Point_EDGE[point];
                while (edge != 0) {
                    this.edgeEventByEdge(point, Edge_P[edge], node);
                    edge = Edge_NEXT[edge];
                }
            }
        }
        // this.finalizationPolygon(); // Clean up
        {
            // Get an Internal triangle to start with
            let t = this._front_head.next.triangle;
            const p = this._front_head.next.point;

            // optimized
            let i = findPoint(t, p);
            let nce = Tri_FLAGS[t] & (0x1 << CW[i]);
            while (nce == 0) {
                t = Tri_NEIGHBORS[t + CCW[i]];
                i = findPoint(t, p);
                nce = Tri_FLAGS[t] & (0x1 << CW[i]);
            }
            // not optimized
// 		while (!t.getConstrainedEdgeCW(p)) {
// 			t = t.neighborCCW(p);
// 		}

            // Collect interior triangles constrained by edges
            this.meshClean(t);
        }
    }

    // addPolylineData(positions: Float32Array) {
    //     const first = newPoint(positions[0], positions[1]);
    //     this._inputPoints.push(first);
    //     let prev = first;
    //     for (let n = 2; n < positions.length; n += 2) {
    //         const next = newPoint(positions[n], positions[n + 1]);
    //         this._inputPoints.push(next);
    //         newEdge(prev, next);
    //         prev = next;
    //     }
    //     newEdge(prev, first);
    // }
    //
    // addPolyline(polyline: Array<Point>) {
    //     const polylineMax = polyline.length - 1;
    //     for (let n = 0; n < polylineMax; ++n) {
    //         newEdge(polyline[n], polyline[n + 1]);
    //     }
    //     newEdge(polyline[polylineMax], polyline[0]);
    //
    //     this._inputPoints = this._inputPoints.concat(polyline);
    // }

    renderTriangles(baseVertex = 0): Uint16Array {
        const indices = new Uint16Array(this._triangles.length * 3);
        let i = 0;
        for (const triangle of this._triangles) {
            indices[i++] = Tri_POINTS[triangle + 0] + baseVertex;
            indices[i++] = Tri_POINTS[triangle + 1] + baseVertex;
            indices[i++] = Tri_POINTS[triangle + 2] + baseVertex;
        }
        return indices;
    }

    mapTriangleToNodes(triangle: Tri) {
        if (Tri_NEIGHBORS[triangle + 0] == 0) { this.front_locatePoint_and_set_neighbor(triangle, Tri_POINTS[triangle + 2]); }
        if (Tri_NEIGHBORS[triangle + 1] == 0) { this.front_locatePoint_and_set_neighbor(triangle, Tri_POINTS[triangle + 0]); }
        if (Tri_NEIGHBORS[triangle + 2] == 0) { this.front_locatePoint_and_set_neighbor(triangle, Tri_POINTS[triangle + 1]); }
    }

    meshClean(t: Tri) {
        const tmp = TRIANGLES_ARRAY;
        let length = this._triangles.length;
        tmp[0] = t;
        let size = 1;
        while (size > 0) {
            const t = tmp[--size];
            const flags = Tri_FLAGS[t];
            if ((flags & MASK_INTERIOR) != 0) {
                continue;
            }
            Tri_FLAGS[t] = flags | MASK_INTERIOR;
            this._triangles[length++] = t;
            if ((flags & MASK_CONSTRAINED_EDGE_0) == 0) { tmp[size++] = Tri_NEIGHBORS[t]; }
            if ((flags & MASK_CONSTRAINED_EDGE_1) == 0) { tmp[size++] = Tri_NEIGHBORS[t + 1]; }
            if ((flags & MASK_CONSTRAINED_EDGE_2) == 0) { tmp[size++] = Tri_NEIGHBORS[t + 2]; }
        }
    }

    front_locateNode(x: number): PNode | null {
        let node: PNode | null = this._front_search_node;

        if (x < node.x) {
            while ((node = node.prev) != null) {
                if (x >= node.x) {
                    this._front_search_node = node;
                    return node;
                }
            }
        } else {
            while ((node = node.next) != null) {
                if (x < node.x) {
                    this._front_search_node = node.prev as PNode;
                    return node.prev;
                }
            }
        }

        return null;
    }

    front_locatePoint_and_set_neighbor(triangle: Tri, point: Point) {
        const px = Point_X[point];
        let node: PNode | null = this._front_search_node;
        const nx = node.x;

        if (px == nx) {
            if (point != node.point) {
                // We might have two nodes with same x value for a short time
                if (point == (node.prev as PNode).point) {
                    node = node.prev;
                } else if (point == (node.next as PNode).point) {
                    node = node.next;
                } else {
                    throw new Error("Invalid AdvancingFront.locatePoint call!");
                }
            }
        } else if (px < nx) {
            while ((node = node.prev) != null) {
                if (point == (node as PNode).point) {
                    break;
                }
            }
        } else {
            while ((node = node.next) != null) {
                if (point == (node as PNode).point) {
                    break;
                }
            }
        }

        if (node != null) {
            this._front_search_node = node;
            node.triangle = triangle;
        }
        return node;
    }

    /**
     * Find closes node to the left of the new point and
     * create a new Tri_ If needed new holes and basins
     * will be filled to.
     */
    pointEvent(point: Point): PNode {
        const node = this.front_locateNode(Point_X[point])!;
        const new_node = this.newFrontTriangle(point, node);

        // Only need to check +epsilon since point never have smaller
        // x value than node due to how we fetch nodes from the front
        if (Point_X[point] <= (node.x + EPSILON)) {
            this.fill(node);
        }

        this.fillAdvancingFront(new_node);
        return new_node;
    }

    edgeEventByEdge(q: Point, p: Point, node: PNode) {
        this._edge_event_constrained_edge_p = p;
        this._edge_event_constrained_edge_q = q;

        if (isEdgeSide(node.triangle, p, q)) { return; }

        // For now we will do all needed filling
        // TODO: integrate with flip process might give some better performance
        //       but for now this avoid the issue with cases that needs both flips and fills
        const px = Point_X[p];
        if (px > Point_X[q]) {
            let it = node;
            while ((it.next as PNode).x < px) {
                // Check if next node is below the edge
                if (orient2d(q, (it.next as PNode).point, p) == CCW) {
                    const it2 = it;
                    while (it2.x < px) {
                        if (orient2d(it2.point,
                            (it2.next as PNode).point,
                            ((it2.next as PNode).next as PNode).point) == CCW) {
                            // Concave
                            this.fillRightConcaveEdgeEvent(q, p, it2);
                            break;
                        }
                        // Convex
                        this.fillRightConvexEdgeEvent(q, p, it2);
                        // Retry this one
                    }
                } else {
                    it = it.next as PNode;
                }
            }
        } else {
            let it = node;
            while ((it.prev as PNode).x > px) {
                // Check if next node is below the edge
                if (orient2d(q, (it.prev as PNode).point, p) == CW) {
                    const it2 = it;
                    while (it2.x > px) {
                        if (orient2d(it2.point,
                            (it2.prev as PNode).point,
                            ((it2.prev as PNode).prev as PNode).point) == CW) {
                            // Concave
                            this.fillLeftConcaveEdgeEvent(q, p, it2);
                            break;
                        }
                        // Convex
                        this.fillLeftConvexEdgeEvent(q, p, it2);
                        // Retry this one
                    }
                } else {
                    it = it.prev as PNode;
                }
            }
        }

        this.edgeEventByPoints(p, q, node.triangle, q);
    }

    edgeEventByPoints(ep: Point, eq: Point, triangle: Tri, point: Point) {
        while (triangle != 0) {
            if (isEdgeSide(triangle, ep, eq)) { return; }

            const i = findPoint(triangle, point);
            const o1 = orient2d(eq, Tri_POINTS[triangle + CW[i]], ep);
            const o2 = orient2d(eq, Tri_POINTS[triangle + CCW[i]], ep);
            if (o1 == COLLINEAR || o2 == COLLINEAR) { throw new Error("collinear"); }

            if (o1 != o2) {
                // This triangle crosses constraint so lets flippin start!
                this.flipEdgeEvent(ep, eq, triangle, point, i);
                return;
            }

            // Need to decide if we are rotating CW or CCW to get to a triangle
            // that will cross edge
            // 			triangle = o1 == CW ? Tri_neighborCCW(point) : Tri_neighborCW(point);
            triangle = Tri_NEIGHBORS[triangle + o1[i + 3]];
        }
    }

    newFrontTriangle(point: Point, node: PNode): PNode {
        const triangle = newTriangle(point, node.point, (node.next as PNode).point);

        markNeighborTriangle(triangle, node.triangle);

        const new_node = new PNode(point, 0);
        new_node.next = node.next;
        new_node.prev = node;
        (node.next as PNode).prev = new_node;
        node.next = new_node;

        if (!this.legalize(triangle)) {
            this.mapTriangleToNodes(triangle);
        }

        return new_node;
    }

    /**
     * Adds a triangle to the advancing front to fill a hole.
     * @param node - middle node, that is the bottom of the hole
     */
    fill(node: PNode) {
        if (!node.prev || !node.next) {
            throw new Error("null assert");
        }
        const triangle = newTriangle(node.prev.point, node.point, node.next.point);

        // TODO: should copy the constrained_edge value from neighbor triangles
        // for now constrained_edge values are copied during the legalize
        markNeighborTriangle(triangle, node.prev.triangle);
        markNeighborTriangle(triangle, node.triangle);

        // Update the advancing front
        node.prev.next = node.next;
        node.next.prev = node.prev;

        // If it was legalized the triangle has already been mapped
        if (!this.legalize(triangle)) {
            this.mapTriangleToNodes(triangle);
        }
    }

    /**
     * Fills holes in the Advancing Front
     */
    fillAdvancingFront(n: PNode) {
        let node: PNode;
        let angle: number;
        const pi_half = PI_2;

        // Fill right holes
        node = n.next as PNode;
        while (node.next) {
            angle = node.getHoleAngle();
            if (angle > pi_half || angle < -pi_half) { break; }
            this.fill(node);
            node = node.next;
        }

        // Fill left holes
        node = n.prev as PNode;
        while (node.prev) {
            angle = node.getHoleAngle();
            if (angle > pi_half || angle < -pi_half) { break; }
            this.fill(node);
            node = node.prev;
        }

        // Fill right basins
        if (n.next && n.next.next && n.getBasinAngle() < PI_3div4) {
            this.fillBasin(n);
        }
    }

    /**
     * Returns true if triangle was legalized
     */
    legalize(t: Tri): boolean {
        if ((Tri_FLAGS[t] & MASK_DELAUNAY_EDGE_0) == 0) {
            const ot = Tri_NEIGHBORS[t];
            if (ot != 0) {
                const p = Tri_POINTS[t];
                const oi = findPointCCW(ot, Tri_POINTS[t + 2]);
                const op = Tri_POINTS[ot + oi];

                // If this is a Constrained Edge or a Delaunay Edge(only during recursive legalization)
                // then we should not try to legalize
                const oi_constrained_edge = (Tri_FLAGS[ot] & (0x1 << oi)) >>> oi;
                if (oi_constrained_edge != 0 || (Tri_FLAGS[ot] & (MASK_DELAUNAY_EDGE_0 << oi)) != 0) {
                    Tri_FLAGS[t] = (Tri_FLAGS[t] & ~MASK_CONSTRAINED_EDGE_0) | oi_constrained_edge;
                } else if (insideIncircle(p, Tri_POINTS[t + 1], Tri_POINTS[t + 2], op)) {
                    // Lets mark this shared edge as Delaunay
                    Tri_FLAGS[t] |= MASK_DELAUNAY_EDGE_0;
                    markDelaunayEdgeByIndex(ot, oi);

                    // Lets rotate shared edge one vertex CW to legalize it
                    rotateTrianglePairFromIndices(t, p, 0, ot, op, oi);

                    // We now got one valid Delaunay Edge shared by two triangles
                    // This gives us 4 new edges to check for Delaunay
                    // Make sure that triangle to node mapping is done only one time for a specific triangle
                    if (!this.legalize(t)) { this.mapTriangleToNodes(t); }
                    if (!this.legalize(ot)) { this.mapTriangleToNodes(ot); }

                    // Reset the Delaunay edges, since they only are valid Delaunay edges
                    // until we add a new triangle or point.
                    // XXX: need to think about this. Can these edges be tried after we
                    //      return to previous recursive level?
                    Tri_FLAGS[t] &= ~MASK_DELAUNAY_EDGE_0;
                    removeDelaunayEdgeByIndex(ot, oi);

                    // If triangle have been legalized no need to check the other edges since
                    // the recursive legalization will handles those so we can end here.
                    return true;
                }
            }
        }

        /// 1
        if ((Tri_FLAGS[t] & MASK_DELAUNAY_EDGE_1) == 0) {
            const ot = Tri_NEIGHBORS[t + 1];
            if (ot != 0) {
                const p = Tri_POINTS[t + 1];
                const oi = findPointCCW(ot, Tri_POINTS[t]);
                const op = Tri_POINTS[ot + oi];
                const oi_constrained_edge = (Tri_FLAGS[ot] & (0x1 << oi)) >>> oi;
                if (oi_constrained_edge != 0 || (Tri_FLAGS[ot] & (MASK_DELAUNAY_EDGE_0 << oi)) != 0) {
                    Tri_FLAGS[t] = (Tri_FLAGS[t] & ~MASK_CONSTRAINED_EDGE_1) | (oi_constrained_edge << 1);
                } else if (insideIncircle(p, Tri_POINTS[t + 2], Tri_POINTS[t], op)) {
                    Tri_FLAGS[t] |= MASK_DELAUNAY_EDGE_1;
                    markDelaunayEdgeByIndex(ot, oi);

                    rotateTrianglePairFromIndices(t, p, 1, ot, op, oi);

                    if (!this.legalize(t)) { this.mapTriangleToNodes(t); }
                    if (!this.legalize(ot)) { this.mapTriangleToNodes(ot); }

                    Tri_FLAGS[t] &= ~MASK_DELAUNAY_EDGE_1;
                    removeDelaunayEdgeByIndex(ot, oi);
                    return true;
                }
            }
        }
        /// 2
        if ((Tri_FLAGS[t] & MASK_DELAUNAY_EDGE_2) == 0) {
            const ot = Tri_NEIGHBORS[t + 2];
            if (ot != 0) {
                const p = Tri_POINTS[t + 2];
                const oi = findPointCCW(ot, Tri_POINTS[t + 1]);
                const op = Tri_POINTS[ot + oi];
                const oi_constrained_edge = (Tri_FLAGS[ot] & (0x1 << oi)) >>> oi;
                if (oi_constrained_edge != 0 || (Tri_FLAGS[ot] & (MASK_DELAUNAY_EDGE_0 << oi)) != 0) {
                    Tri_FLAGS[t] = (Tri_FLAGS[t] & ~MASK_CONSTRAINED_EDGE_2) | (oi_constrained_edge << 2);
                } else if (insideIncircle(p, Tri_POINTS[t], Tri_POINTS[t + 1], op)) {
                    Tri_FLAGS[t] |= MASK_DELAUNAY_EDGE_2;
                    markDelaunayEdgeByIndex(ot, oi);

                    rotateTrianglePairFromIndices(t, p, 2, ot, op, oi);
                    if (!this.legalize(t)) { this.mapTriangleToNodes(t); }
                    if (!this.legalize(ot)) { this.mapTriangleToNodes(ot); }
                    Tri_FLAGS[t] &= ~MASK_DELAUNAY_EDGE_2;
                    removeDelaunayEdgeByIndex(ot, oi);
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Fills a basin that has formed on the Advancing Front to the right
     * of given node.<br>
     * First we decide a left,bottom and right node that forms the
     * boundaries of the basin. Then we do a recursive fill.
     *
     * @param node_ - starting node, this or next node will be left node
     */
    fillBasin(node_: PNode) {
        if (!node_.next || !node_.next.next) {
            throw new Error("null assert");
        }
        const basin_left_node =
            orient2d(node_.point, node_.next.point, node_.next.next.point) == CCW ? node_.next.next : node_.next;

        // Find the bottom and right node
        let basin_bottom_node = basin_left_node;
        while (basin_bottom_node.next != null && basin_bottom_node.y >= basin_bottom_node.next.y) {
            basin_bottom_node = basin_bottom_node.next;
        }

        // No valid basin
        if (basin_bottom_node == basin_left_node) { return; }

        let basin_right_node = basin_bottom_node;
        while (basin_right_node.next != null && basin_right_node.y < basin_right_node.next.y) {
            basin_right_node = basin_right_node.next;
        }

        // No valid basins
        if (basin_right_node == basin_bottom_node) { return; }

        const basin_width = basin_right_node.x - basin_left_node.x;
        const basin_left_highest = basin_left_node.y > basin_right_node.y;

        let node = basin_bottom_node;
        let height = basin_left_highest ? (basin_left_node.y - node.y) : (basin_right_node.y - node.y);

        while (basin_width <= height) {
            this.fill(node);

            if (node.prev == basin_left_node && node.next == basin_right_node) {
                return;
            } else if (node.prev == basin_left_node) {
                if (orient2d(node.point, (node.next as PNode).point, ((node.next as PNode).next as PNode).point) == CW) { return; }
                node = node.next as PNode;
            } else if (node.next == basin_right_node) {
                if (orient2d(node.point, (node.prev as PNode).point, ((node.prev as PNode).prev as PNode).point) == CCW) { return; }
                node = node.prev as PNode;
            } else {
                // Continue with the neighbor node with lowest Y value
                node = ((node.prev as PNode).y < (node.next as PNode).y ? node.prev : node.next) as PNode;
            }

            height = basin_left_highest ? (basin_left_node.y - node.y) : (basin_right_node.y - node.y);
        }
    }

    fillRightAboveEdgeEvent(q: Point, p: Point, node: PNode) {
        while ((node.next as PNode).x < Point_X[p]) {
            // Check if next node is below the edge
            if (orient2d(q, (node.next as PNode).point, p) == CCW) {
                this.fillRightBelowEdgeEvent(q, p, node);
            } else {
                node = node.next as PNode;
            }
        }
    }

    fillRightBelowEdgeEvent(q: Point, p: Point, node: PNode) {
        const x = Point_X[p];
        while (node.x < x) {
            if (orient2d(node.point, (node.next as PNode).point, ((node.next as PNode).next as PNode).point) == CCW) {
                // Concave
                this.fillRightConcaveEdgeEvent(q, p, node);
                return;
            } else {
                this.fillRightConvexEdgeEvent(q, p, node); // Convex
                // Retry this one
            }
        }
    }

    fillRightConcaveEdgeEvent(q: Point, p: Point, node: PNode) {
        while (node.next) {
            this.fill(node.next);
            if (node.next.point != p) {
                // Next above or below edge?
                if (orient2d(q, node.next.point, p) == CCW) {
                    // Below
                    if (orient2d(node.point, node.next.point, (node.next.next as PNode).point) == CCW) {
                        // Next is concave
                        continue;
                    }
                    // else {
                    // Next is convex
                    // }
                }
            }
            return;
        }
    }

    fillRightConvexEdgeEvent(q: Point, p: Point, node: PNode) {
        while (node.next) {
            // Next concave or convex?
            if (orient2d(node.next.point, (node.next.next as PNode).point, ((node.next.next as PNode).next as PNode).point) == CCW) {
                // Concave
                this.fillRightConcaveEdgeEvent(q, p, node.next);
            } else {
                // Convex
                // Next above or below edge?
                if (orient2d(q, (node.next.next as PNode).point, p) == CCW) {
                    // Below
                    node = node.next;
                    continue;
                }
                // else
                // Above
            }
            return;
        }
    }

    fillLeftAboveEdgeEvent(q: Point, p: Point, node: PNode) {
        const x = Point_X[p];
        while (node.prev && node.prev.x > x) {
            // Check if next node is below the edge
            if (orient2d(q, node.prev.point, p) == CW) {
                this.fillLeftBelowEdgeEvent(q, p, node);
            } else {
                node = node.prev;
            }
        }
    }

    fillLeftBelowEdgeEvent(q: Point, p: Point, node: PNode) {
        const x = Point_X[p];
        while (node.prev && node.x > x) {
            if (orient2d(node.point, node.prev.point, (node.prev.prev as PNode).point) == CW) {
                // Concave
                this.fillLeftConcaveEdgeEvent(q, p, node);
                return;
            }

            // Convex
            this.fillLeftConvexEdgeEvent(q, p, node);
            // Retry this one
        }
    }

    fillLeftConvexEdgeEvent(q: Point, p: Point, node: PNode) {
        while (node.prev) {
            node = node.prev;
            // Next concave or convex?
            if (orient2d(node.point, (node.prev as PNode).point, ((node.prev as PNode).prev as PNode).point) == CW) {
                // Concave
                this.fillLeftConcaveEdgeEvent(q, p, node);
            } else {
                // Convex
                // Next above or below edge?
                if (orient2d(q, (node.prev as PNode).point, p) == CW) {
                    // Below
                    continue;
                } else {
                    // Above
                }
            }
            return;
        }
    }

    fillLeftConcaveEdgeEvent(q: Point, p: Point, node: PNode) {
        while (node.prev) {
            this.fill(node.prev);
            if (node.prev.point != p) {
                // Next above or below edge?
                if (orient2d(q, node.prev.point, p) == CW) {
                    // Below
                    if (orient2d(node.point, node.prev.point, (node.prev.prev as PNode).point) == CW) {
                        // Next is concave
                        continue;
                    }
                    // Next is convex
                }
            }
            return;
        }
    }

    flipEdgeEvent(ep: Point, eq: Point, t: Tri, p: Point, i: number) {
// 		var i = t.getPointIndex(p);
        const ot = Tri_NEIGHBORS[t + i];
        if (ot == 0) {
            // If we want to integrate the fillEdgeEvent do it here
            // With current implementation we should never get here
            throw new Error("Sweep::[BUG:FIXME] FLIP failed due to missing triangle!");
        }
// 		var op = ot.oppositePoint(t, p);
        const t_p_cw = Tri_POINTS[t + CCW[i]];
        const t_p_ccw = Tri_POINTS[t + CW[i]];
        const oi = findPointCCW(ot, t_p_cw);
        const op = Tri_POINTS[ot + oi];

        if (inScanArea(p, t_p_ccw, t_p_cw, op)) {
            // Lets rotate shared edge one vertex CW
            rotateTrianglePairFromIndices(t, p, i, ot, op, oi);
            this.mapTriangleToNodes(t);
            this.mapTriangleToNodes(ot);

            // @TODO: equals?
            if (p == eq && op == ep) {
                if (eq == this._edge_event_constrained_edge_q && ep == this._edge_event_constrained_edge_p) {
                    markConstrainedEdgeByPoints(t, ep, eq);
                    markConstrainedEdgeByPoints(ot, ep, eq);
                    this.legalize(t);
                    this.legalize(ot);
                } else {
                    // XXX: I think one of the triangles should be legalized here?
                }
            } else {
                const o = orient2d(eq, op, ep);
                t = this.nextFlipTriangle(o, t, ot, p, op);
                this.flipEdgeEvent(ep, eq, t, p, findPoint(t, p));
            }
        } else {
// 			var newP = nextFlipPoint(ep, eq, ot, op, oi);
            const new_pi = nextFlipPointIndex(ep, eq, ot, op, oi);
// 			flipScanEdgeEvent(ep, eq, t, ot, newP);
            this.flipScanEdgeEvent(ep, eq, t, ot, Tri_POINTS[ot + new_pi], new_pi);
            this.edgeEventByPoints(ep, eq, t, p);
        }
    }

    nextFlipTriangle(o: Orientation, t: Tri, ot: Tri, p: Point, op: Point): Tri {
        if (o == CCW) {
            // ot is not crossing edge after flip
            const s = ot;
            ot = t;
            t = s;
        }

        // t is not crossing edge after flip
        markDelaunayEdgeByIndex(t, findEdge(t, p, op));
        this.legalize(t);
        clearDelaunayEdges(t);
        return ot;
    }

    flipScanEdgeEvent(ep: Point, eq: Point, flip_triangle: Tri, t: Tri, p: Point, i: number) {
        const ot = Tri_NEIGHBORS[t + i];

        // If we want to integrate the fillEdgeEvent do it here
        // With current implementation we should never get here
        if (ot == 0) {
            throw new Error("Sweep::[BUG:FIXME] FLIP failed due to missing triangle");
        }

        const oi = findPointCCW(ot, Tri_POINTS[t + CCW[i]]);
        const op = Tri_POINTS[ot + oi];

        const fi = findPoint(flip_triangle, eq);
        const flip_cw = Tri_POINTS[flip_triangle + CCW[fi]];
        const flip_ccw = Tri_POINTS[flip_triangle + CW[fi]];
        if (inScanArea(eq, flip_ccw, flip_cw, op)) {
            // flip with new edge op.eq
            this.flipEdgeEvent(eq, op, ot, op, oi);
            // TODO: Actually I just figured out that it should be possible to
            //       improve this by getting the next ot and op before the the above
            //       flip and continue the flipScanEdgeEvent here
            // set new ot and op here and loop back to inScanArea test
            // also need to set a new flip_triangle first
            // Turns out at first glance that this is somewhat complicated
            // so it will have to wait.
        } else {
// 			var newP = nextFlipPoint(ep, eq, ot, op, oi);
            const new_pi = nextFlipPointIndex(ep, eq, ot, op, oi);
// 			flipScanEdgeEvent(ep, eq, flip_triangle, ot, newP);
            this.flipScanEdgeEvent(ep, eq, flip_triangle, ot, Tri_POINTS[ot + new_pi], oi);
        }
    }
}

export class Poly2Tri {
    points: number[] = [];
    edges: number[] = [];

    constructor() {
    }

    region(points: number[]): this {
        const first = this.points.length >>> 1;
        let prev = first;
        for (let i = 1; i < points.length >>> 1; ++i) {
            this.edges.push(prev);
            this.edges.push(first + i);
            prev = first + i;
        }
        this.edges.push(prev, first);
        this.points = this.points.concat(points);
        return this;
    }

    triangulate(baseVertex = 0): Uint16Array {
        return new Triangulator(this.points, this.edges).renderTriangles(baseVertex);
    }
}
