import {Color4, Recta, Vec2} from "@highduck/math";

/*** serialization utils **/
export function fixPrecision(x: number, precision: number): number {
    const p = Math.pow(10, precision);
    return Math.ceil(x * p - 0.4999999999999) / p;
    // return x;
}

// export function tupleMatrix2D(m: Matrix2D): [number, number, number, number, number, number] {
//     return [m.a, m.b, m.c, m.d, m.x, m.y];
// }

export function tupleRect(rc: Recta): [number, number, number, number] {
    return [rc.x, rc.y, rc.width, rc.height];
}

export function tupleColor4(c: Color4): [number, number, number, number] {
    return [
        fixPrecision(c.r, 3),
        fixPrecision(c.g, 3),
        fixPrecision(c.b, 3),
        fixPrecision(c.a, 3),
    ];
}

export function tupleVec2(v: Vec2, precision = 4): [number, number] {
    return [
        fixPrecision(v.x, precision),
        fixPrecision(v.y, precision)
    ];
}

export function mapToDict<T>(map: Map<string, T>) {
    const result: { [key: string]: T; } = {};
    for (const key of map.keys()) {
        result[key] = map.get(key)!;
    }
    return result;
}
