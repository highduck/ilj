import {IVec2, Vec2} from "./Vec2";

export class Matrix2D {

    static readonly IDENTITY: Readonly<Matrix2D> = new Matrix2D();

    constructor(public a: number = 1, public b: number = 0,
                public c: number = 0, public d: number = 1,
                public x: number = 0, public y: number = 0) {

    }

    copyFrom(m: Readonly<Matrix2D>) {
        this.a = m.a;
        this.b = m.b;
        this.c = m.c;
        this.d = m.d;
        this.x = m.x;
        this.y = m.y;
    }

    set(a: number, b: number,
        c: number, d: number,
        x: number, y: number) {
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
        this.x = x;
        this.y = y;
    }

    setScaleSkew(sx: number, sy: number, rx: number, ry: number) {
        this.a = Math.cos(ry) * sx;
        this.b = Math.sin(ry) * sx;
        this.c = -Math.sin(rx) * sy;
        this.d = Math.cos(rx) * sy;
    }

    translate(x: number, y: number): this {
        this.x += this.a * x + this.c * y;
        this.y += this.d * y + this.b * x;
        return this;
    }

    concatOrigin(matrix: Matrix2D, origin: Vec2): this {
        // translate(origin)
        // this = this * matrix
        // translate(-origin)
        // M * translation(origin) * m * translation(-origin)

        const a = this.a;
        const b = this.b;
        const c = this.c;
        const d = this.d;

        this.a = a * matrix.a + c * matrix.b;
        this.b = b * matrix.a + d * matrix.b;
        this.c = a * matrix.c + c * matrix.d;
        this.d = b * matrix.c + d * matrix.d;
        this.x += (a - this.a) * origin.x + (c - this.c) * origin.y + a * matrix.x + c * matrix.y;
        this.y += (d - this.d) * origin.y + (b - this.b) * origin.x + b * matrix.x + d * matrix.y;

        return this;
    }

    transform(x: number, y: number, out: Vec2): Vec2 {
        out.x = x * this.a + y * this.c + this.x;
        out.y = x * this.b + y * this.d + this.y;
        return out;
    }

    transformWith(v: Vec2) {
        const x = v.x;
        const y = v.y;
        v.x = x * this.a + y * this.c + this.x;
        v.y = x * this.b + y * this.d + this.y;
    }

    scale(x: number, y: number): this {
        this.a *= x;
        this.b *= x;
        this.c *= y;
        this.d *= y;
        return this;
    }

    rotate(rads: number): this {
        const sn = Math.sin(rads);
        const cs = Math.cos(rads);
        const a = this.a;
        const b = this.b;
        const c = this.c;
        const d = this.d;
        this.a = a * cs + c * sn;
        this.c = -a * sn + c * cs;
        this.b = d * sn + b * cs;
        this.d = d * cs - b * sn;
        return this;
    }

    skew(rx: number, ry: number): this {
        const ra = Math.cos(ry);
        const rb = Math.sin(ry);
        const rc = -Math.sin(rx);
        const rd = Math.cos(rx);
        const a = this.a;
        const b = this.b;
        const c = this.c;
        const d = this.d;
        this.a = a * ra + c * rb;
        this.b = b * ra + d * rb;
        this.c = a * rc + c * rd;
        this.d = b * rc + d * rd;

        return this;
    }

    get determinant(): number {
        return this.a * this.d - this.c * this.b;
    }

    multiplyWith(right: Matrix2D): this {
        Matrix2D.multiply(this, right, this);
        return this;
    }

    transformInverseWith(v: Vec2): boolean {
        const a = this.a;
        const b = this.b;
        const c = this.c;
        const d = this.d;
        const det = /** this.determinant **/ a * d - c * b;
        if (det === 0.0) {
            return false;
        }
        const ix = v.x - this.x;
        const iy = v.y - this.y;
        v.x = (ix * d - iy * c) / det;
        v.y = (iy * a - ix * b) / det;
        return true;
    }

    writeToArray(arr: number[], index: number) {
        arr[index++] = this.a;
        arr[index++] = this.b;
        arr[index++] = this.c;
        arr[index++] = this.d;
        arr[index++] = this.x;
        arr[index++] = this.y;
    }

    readFromArray(arr: number[], index: number) {
        this.a = arr[index++];
        this.b = arr[index++];
        this.c = arr[index++];
        this.d = arr[index++];
        this.x = arr[index++];
        this.y = arr[index++];
    }

    toString(): string {
        return `a: ${this.a} b: ${this.b} c: ${this.c} d: ${this.d} x: ${this.x} y: ${this.y}`
    }

    extractScale(out: Vec2): this {
        out.x = Math.sqrt(this.a * this.a + this.b * this.b);
        out.y = Math.sqrt(this.c * this.c + this.d * this.d);
        // if (a < 0.0) sx = -sx;
        // if (d < 0.0) sy = -sy;
        return this;
    }

    extractSkew(out: Vec2): this {
        out.x = Math.atan2(-this.c, this.d);
        out.y = Math.atan2(this.b, this.a);
        return this;
    }

    // NOTES: to do `concat` style method - just swap right and left matrices,
    // it will act like `this` is right, `m` is left (pre-multiply)
    static multiply(l: Matrix2D, r: Matrix2D, out: Matrix2D) {
        const a = l.a * r.a + l.c * r.b;
        const b = l.b * r.a + l.d * r.b;
        const c = l.a * r.c + l.c * r.d;
        const d = l.b * r.c + l.d * r.d;
        const x = l.a * r.x + l.c * r.y + l.x;
        const y = l.b * r.x + l.d * r.y + l.y;
        out.a = a;
        out.b = b;
        out.c = c;
        out.d = d;
        out.x = x;
        out.y = y;
    }

    static inverse(m: Matrix2D): boolean {
        let a = m.a;
        let b = m.b;
        let c = m.c;
        let d = m.d;
        let det = /** this.determinant **/ m.a * m.d - m.c * m.b;
        if (det === 0) {
            return false;
        }
        det = 1 / det;
        a *= det;
        b *= det;
        c *= det;
        d *= det;
        m.a = d;
        m.b = -b;
        m.c = -c;
        m.d = a;

        const x = m.x;
        const y = m.y;
        m.x = y * c - x * d;
        m.y = x * b - y * a;

        return true;
    }

    static unpack_scale([a, b, c, d]: number[], out: [number, number]) {
        out[0] = Math.sqrt(a * a + b * b);
        out[1] = Math.sqrt(c * c + d * d);
        // if (a < 0.0) sx = -sx;
        // if (d < 0.0) sy = -sy;
    }

    static unpack_skew([a, b, c, d]: number[], out: [number, number]) {
        out[0] = Math.atan2(-c, d);
        out[1] = Math.atan2(b, a);
    }

    static unpack_rotation(m: number[]): number {
        const s: [number, number] = [0, 0];
        Matrix2D.unpack_skew(m, s);
        return s[0] == s[1] ? s[1] : 0;
    }
}
