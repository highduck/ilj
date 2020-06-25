import {Matrix2D} from "./Matrix2D";
import {Rect} from "./Rect";

export function transformRectMatrix2D(rc: Rect, matrix: Matrix2D, out: Rect) {
    const a = matrix.a;
    const b = matrix.b;
    const c = matrix.c;
    const d = matrix.d;
    let xMin = rc.x;
    let yMin = rc.y;
    let xMax = xMin + rc.width;
    let yMax = yMin + rc.height;
    const a0 = xMin * a;
    const a1 = xMax * a;
    const b0 = xMin * b;
    const b1 = xMax * b;
    const c0 = yMin * c;
    const c1 = yMax * c;
    const d0 = yMin * d;
    const d1 = yMax * d;
    const x0 = a0 + c0;
    const y0 = b0 + d0;
    const x1 = a1 + c0;
    const y1 = b1 + d0;
    const x2 = a1 + c1;
    const y2 = b1 + d1;
    const x3 = a0 + c1;
    const y3 = b0 + d1;
    xMin = Math.min(x0, x1, x2, x3);
    yMin = Math.min(y0, y1, y2, y3);
    xMax = Math.max(x0, x1, x2, x3);
    yMax = Math.max(y0, y1, y2, y3);
    out.x = xMin + matrix.x;
    out.y = yMin + matrix.y;
    out.width = xMax - xMin;
    out.height = yMax - yMin;
}