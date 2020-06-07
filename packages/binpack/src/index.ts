/**
 Based on [RectangleBinPack](https://github.com/juj/RectangleBinPack) library.
 */

const enum Flag {
    Empty = 0,
    Packed = 1,
    Rotated = 2
}

export const enum Method {
    All = 0,
    BestAreaFit,
    ContactPoint,
    BottomLeft,
    BestLongSideFit,
    BestShortSideFit
}

interface RectSize {
    w: number;
    h: number;
}

interface Rect {
    x: number;
    y: number;
    w: number;
    h: number;
}

// precondition if 2 rectangles possible to be intersected
function sat(a: Rect, b: Rect): boolean {
    return a.x < (b.x + b.w) && (a.x + a.w) > b.x &&
        a.y < (b.y + b.h) && (a.y + a.h) > b.y;
}

function contains(a: Rect, b: Rect): boolean {
    return a.x <= b.x && a.y <= b.y &&
        (a.x + a.w) >= (b.x + b.w) &&
        (a.y + a.h) >= (b.y + b.h);
}

interface Placement {
    x: number;
    y: number;
    w: number;
    h: number;
    // scores
    A: number;
    B: number;
    matched: boolean;
}

const maxScore = 0xFFFFFFFF;

function resetPlacement(v: Placement) {
    v.x = v.y = v.w = v.h = 0;
    v.A = v.B = maxScore;
    v.matched = false;
}

function pushFreeNode(list: Rect[], rect: Rect) {
    let end = list.length;
    for (let i = 0; i < end; ++i) {
        const free = list[i];
        if (sat(rect, free)) {
            if (contains(free, rect)) {
                return;
            }
            if (contains(rect, free)) {
                list.splice(i, 1);
                --end;
                --i;
            }
        }
    }
    list.push(rect);
}

function splitFreeNode(list: Rect[], free: Rect, used: Rect) {
    // Test with SAT if the rectangles even intersect.
    if (!sat(used, free)) {
        pushFreeNode(list, free);
        return;
    }

    if (used.x < free.x + free.w && used.x + used.w > free.x) {
        // New node at the top side of the used node.
        const freeB = free.y + free.h;
        if (used.y > free.y && used.y < freeB) {
            pushFreeNode(list, {
                x: free.x,
                y: free.y,
                w: free.w,
                h: used.y - free.y
            });
        }

        // New node at the bottom side of the used node.
        const usedB = used.y + used.h;
        if (usedB < freeB) {
            pushFreeNode(list, {
                x: free.x,
                y: usedB,
                w: free.w,
                h: freeB - usedB
            });
        }
    }

    if (used.y < free.y + free.h && used.y + used.h > free.y) {
        // New node at the left side of the used node.
        if (used.x > free.x && used.x < free.x + free.w) {
            pushFreeNode(list, {
                x: free.x,
                y: free.y,
                w: used.x - free.x,
                h: free.h
            });
        }

        // New node at the right side of the used node.
        const usedR = used.x + used.w;
        const freeR = free.x + free.w;
        if (usedR < freeR) {
            pushFreeNode(list, {
                x: usedR,
                y: free.y,
                w: freeR - usedR,
                h: free.h
            });
        }
    }
}

class MaxRects {
    x: number = 0;
    y: number = 0;
    w: number = 0;
    h: number = 0;
    free: Rect[] = [];
    readonly used: Rect[] = [];

    resize(w: number, h: number) {
        this.x = 0;
        this.y = 0;
        this.w = w;
        this.h = h;
    }

    reset() {
        this.used.length = 0;
        this.free.length = 0;
        this.free.push({
            x: this.x,
            y: this.y,
            w: this.w,
            h: this.h,
        });
    }

    choose(best: Placement, width: number, height: number, place: PlaceFunction, rotate: boolean) {
        best.matched = false;
        for (const rc of this.free) {
            if (rc.w >= width && rc.h >= height) {
                place(best, rc, width, height);
            }
            if (rotate && rc.w >= height && rc.h >= width) {
                place(best, rc, height, width);
            }
        }
    }

    /// Places the given rectangle into the bin.
    place(node: Rect) {
        const nextFreeList: Rect[] = [];
        for (const rect of this.free) {
            splitFreeNode(nextFreeList, rect, node);
        }
        this.free = nextFreeList;
        this.used.push(node);
    }
}

type PlaceFunction = (best: Placement, freeRect: Rect, width: number, height: number) => void;

function bottomLeft(best: Placement, rc: Rect, width: number, height: number): void {
    const top = height + rc.y;
    if (top < best.A || (top === best.A && rc.x < best.B)) {
        best.x = rc.x;
        best.y = rc.y;
        best.w = width;
        best.h = height;
        best.A = top;
        best.B = rc.x;
        best.matched = true;
    }
}

function bestShortSideFit(best: Placement, rc: Rect, width: number, height: number): void {
    const leftoverH = rc.w - width;
    const leftoverV = rc.h - height;
    const shortSideFit = Math.min(leftoverH, leftoverV);
    const longSideFit = Math.max(leftoverH, leftoverV);

    if (shortSideFit < best.A || (shortSideFit === best.A && longSideFit < best.B)) {
        best.x = rc.x;
        best.y = rc.y;
        best.w = width;
        best.h = height;
        best.A = shortSideFit;
        best.B = longSideFit;
        best.matched = true;
    }
}

function bestLongSideFit(best: Placement, rc: Rect, width: number, height: number): void {
    const leftoverH = rc.w - width;
    const leftoverV = rc.h - height;
    const shortSideFit = Math.min(leftoverH, leftoverV);
    const longSideFit = Math.max(leftoverH, leftoverV);

    if (longSideFit < best.B || (longSideFit === best.B && shortSideFit < best.A)) {
        best.x = rc.x;
        best.y = rc.y;
        best.w = width;
        best.h = height;
        best.A = shortSideFit;
        best.B = longSideFit;
        best.matched = true;
    }
}

function bestAreaFit(best: Placement, rc: Rect, width: number, height: number): void {
    // opt: don't ABS: free rect is already bigger than {width,height}
    const spaceX = rc.w - width;
    const spaceY = rc.h - height;
    const shortSideFit = Math.min(spaceX, spaceY);
    const areaFit = rc.w * rc.h - width * height;

    if (areaFit < best.B || (areaFit === best.B && shortSideFit < best.A)) {
        best.x = rc.x;
        best.y = rc.y;
        best.w = width;
        best.h = height;
        best.A = shortSideFit;
        best.B = areaFit;
        best.matched = true;
    }
}

/// Returns 0 if the two intervals i1 and i2 are disjoint, or the length of their overlap otherwise.
function getCommonIntervalLength(a0: number, a1: number, b0: number, b1: number): number {
    return (a1 < b0 || b1 < a0) ? 0 : ((a1 < b1 ? a1 : b1) - (a0 > b0 ? a0 : b0));
}

function createContactPoint(maxRects: MaxRects): PlaceFunction {
    return (best: Placement, rect: Rect, width: number, height: number) => {
        let score = maxScore;

        const x = rect.x;
        const y = rect.y;

        if (x === maxRects.x || x + width === maxRects.x + maxRects.w) {
            score -= height;
        }

        if (y === maxRects.y || y + height === maxRects.y + maxRects.h) {
            score -= width;
        }

        const top = best.A;
        for (let i = 0, end = maxRects.used.length; i < end && score >= top; ++i) {
            const rc = maxRects.used[i];
            if (rc.x === x + width || rc.x + rc.w === x) {
                score -= getCommonIntervalLength(rc.y, rc.y + rc.h, y, y + height);
            }
            if (rc.y === y + height || rc.y + rc.h === y) {
                score -= getCommonIntervalLength(rc.x, rc.x + rc.w, x, x + width);
            }
        }

        if (score < top) {
            best.x = x;
            best.y = y;
            best.w = width;
            best.h = height;
            best.A = score;
            best.matched = true;
        }
    };
}

export class PackerState {
    readonly maxRects = new MaxRects();

    // current canvas size
    w = 0;
    h = 0;

    readonly rects: Rect[] = [];
    readonly flags: Flag[] = [];
    readonly userData: any[] = [];

    constructor(
        readonly maxWidth = 0x8000,
        readonly maxHeight = 0x8000
    ) {
    }

    add(width: number, height: number, userData: any): void {
        console.assert(width > 0 && height > 0);
        console.assert(width <= this.maxWidth && height <= this.maxHeight);
        this.rects.push({x: 0, y: 0, w: width, h: height});
        this.userData.push(userData);
        this.flags.push(Flag.Empty);
    }

    get size() {
        return this.rects.length;
    }

    get empty() {
        return this.rects.length === 0;
    }

    isPacked(i: number): boolean {
        return (this.flags[i] & Flag.Packed) !== 0;
    }

    isRotated(i: number): boolean {
        return (this.flags[i] & Flag.Rotated) !== 0;
    }
}

// input sizes
// output: rects & indices to original

function tryPack(maxRects: MaxRects, rects: Rect[], flags: Flag[], method: PlaceFunction, rotate: boolean, outStats: {
    packed: number,
    area: number,
    boundsArea: number
}) {
    maxRects.reset();
    for (let i = 0; i < flags.length; ++i) {
        flags[i] = Flag.Empty;
    }

    outStats.packed = 0;
    outStats.area = 0;
    let r = 0;
    let b = 0;

    const best: Placement = {x: 0, y: 0, w: 0, h: 0, A: 0, B: 0, matched: false};
    const total = rects.length;
    for (let j = 0; j < total; ++j) {
        resetPlacement(best);
        let bestIndex = -1;
        for (let i = 0; i < total; ++i) {
            if ((flags[i] & Flag.Packed) === 0) {
                const rect = rects[i];
                maxRects.choose(best, rect.w, rect.h, method, rotate)
                if (best.matched) {
                    bestIndex = i;
                }
            }
        }

        if (bestIndex < 0) {
            return;
        }

        maxRects.place({
            x: best.x,
            y: best.y,
            w: best.w,
            h: best.h
        });

        const rect = rects[bestIndex];
        rect.x = best.x;
        rect.y = best.y;

        flags[bestIndex] |= rect.w !== best.w ? (Flag.Packed | Flag.Rotated) : Flag.Packed;

        ++outStats.packed;
        outStats.area += best.w * best.h;

        if (r < best.x + best.w) {
            r = best.x + best.w;
        }

        if (b < best.y + best.h) {
            b = best.y + best.h;
        }
        outStats.boundsArea = r * b;
    }
}

/////////////

const packStartSize = 32;

function getRectsArea(rects: RectSize[]) {
    let acc = 0;
    for (const rc of rects) {
        acc += rc.w * rc.h;
    }
    return acc;
}

function nextSize(sz: RectSize) {
    const t = sz.w;
    sz.w = sz.h << 1;
    // sz.w = sz.h + 16;
    sz.h = t;
}

function estimateSize(sz: RectSize, area: number, maxWidth: number, maxHeight: number) {
    while (area > sz.w * sz.h && (sz.h < maxHeight || sz.w < maxWidth)) {
        nextSize(sz);
    }
}

interface PackStatus {
    method: Method;
    packed: number;
    total: number;
    area: number;
    boundsArea: number;
}

function tryPackState(state: PackerState, method: Method, rotate: boolean): PackStatus {
    const rects = state.rects;
    const flags = state.flags;
    const status: PackStatus = {
        method,
        packed: 0,
        total: state.rects.length,
        area: 0,
        boundsArea: 0
    };
    const maxRects = state.maxRects;
    maxRects.resize(state.w, state.h);

    const methods = [
        bestAreaFit,
        createContactPoint(maxRects),
        bottomLeft,
        bestLongSideFit,
        bestShortSideFit
    ];

    if (method === Method.All) {
        let bestPlacedArea: number = 0;
        let bestBoundsArea: number = state.w * state.h;
        for (let i = 0; i < methods.length; ++i) {
            tryPack(maxRects, rects, flags, methods[i], rotate, status);
            if (status.packed === status.total) {
                status.method = i + 1;
                return status;
            }

            if (status.boundsArea < bestBoundsArea) {
                status.method = i + 1;
                bestBoundsArea = status.boundsArea;
            }

            if (status.area > bestPlacedArea) {
                status.method = i + 1;
                bestPlacedArea = status.area;
                bestBoundsArea = status.boundsArea;
            }
        }
        tryPack(maxRects, rects, flags, methods[status.method - 1], rotate, status);
        return status;
    }

    tryPack(maxRects, rects, flags, methods[method - 1], rotate, status);
    return status;
}

export function packNodes(state: PackerState, method: Method = Method.All, rotate: boolean = true): PackStatus {
    state.w = state.h = packStartSize;
    estimateSize(state, getRectsArea(state.rects), state.maxWidth, state.maxHeight);
    let status = tryPackState(state, method, rotate);
    while (status.packed < status.total) {
        if (state.h >= state.maxHeight && state.w >= state.maxWidth) {
            return status;
        }
        nextSize(state);
        status = tryPackState(state, method, rotate)
    }
    return status;
}

export interface InputRect {
    w: number;
    h: number;
    padding?: number;
    data?: any;
}

export interface InputOptions {
    maxWidth: number;
    maxHeight: number;
    method?: Method;
    rotate?: boolean;
}

export interface OutputRect {
    x: number;
    y: number;
    w: number;
    h: number;
    data?: any;
    rotated: boolean;
}

export interface OutputPage {
    rects: OutputRect[];
    w: number;
    h: number;
    method: Method;
}

export interface PackResult {
    pages: OutputPage[];
    notPacked: InputRect[];

    // original settings which used to pack
    rotate: boolean;
    method: Method;
}

export function pack(rects: InputRect[], options: InputOptions): PackResult {
    const method = options.method ?? Method.All;
    const rotate = options.rotate ?? true;
    const maxW = options.maxWidth;
    const maxH = options.maxWidth;

    const pages: OutputPage[] = [];
    let left = rects.concat();
    const notPacked: InputRect[] = [];

    while (left.length > 0) {
        const state = new PackerState(maxW, maxH);

        for (const rect of left) {
            if (rect.w > 0 && rect.h > 0) {
                const padding = rect.padding ?? 0;
                if (!Number.isInteger(padding) || padding < 0) {
                    console.error('rect padding should be integer > 0');
                    throw 'bad input rect data';
                }
                const w = rect.w + (padding << 1);
                const h = rect.h + (padding << 1);
                if (w <= maxW && h <= maxH) {
                    state.add(w, h, rect);
                    continue;
                }
            }
            notPacked.push(rect);
        }

        left.length = 0;

        const status = packNodes(state, method, rotate);
        const page: OutputPage = {
            w: state.w,
            h: state.h,
            rects: [],
            method: status.method
        };

        for (let i = 0; i < state.rects.length; ++i) {
            if (!state.isPacked(i)) {
                left.push(state.userData[i]);
            } else {
                const rect = state.userData[i] as InputRect;
                const rc = state.rects[i];
                const p = Math.max(0, rect.padding ?? 0);
                page.rects.push({
                    x: rc.x + p,
                    y: rc.y + p,
                    w: rc.w - (p << 1),
                    h: rc.h - (p << 1),
                    rotated: state.isRotated(i),
                    data: rect.data
                });
            }
        }

        pages.push(page);
    }

    return {
        pages,
        notPacked,
        rotate,
        method
    };
}