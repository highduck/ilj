import {Vec2} from "./Vec2";

export class Matrix2D {

    get determinant(): number {
        return this.a * this.d - this.c * this.b;
    }

    static readonly IDENTITY: Readonly<Matrix2D> = new Matrix2D();

    // NOTES: to do `concat` style method - just swap right and left matrices,
    // it will act like `this` is right, `m` is left (pre-multiply)
    static mult(l: Matrix2D, r: Matrix2D, out: Matrix2D) {
        out.set(
            l.a * r.a + l.c * r.b,
            l.b * r.a + l.d * r.b,
            l.a * r.c + l.c * r.d,
            l.b * r.c + l.d * r.d,
            l.a * r.x + l.c * r.y + l.x,
            l.b * r.x + l.d * r.y + l.y,
        );
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

    set(a = 1, b = 0,
        c = 0, d = 1,
        x = 0, y = 0) {
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

    transformTuple(x: number, y: number): [number, number] {
        return [
            x * this.a + y * this.c + this.x,
            x * this.b + y * this.d + this.y,
        ];
    }

    transform(x: number, y: number, out: Vec2): Vec2 {
        out.x = x * this.a + y * this.c + this.x;
        out.y = x * this.b + y * this.d + this.y;
        return out;
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

    mult(right: Matrix2D): this {
        Matrix2D.mult(this, right, this);
        return this;
    }

    transformInverse(x: number, y: number, out: Vec2): boolean {
        const d = this.determinant;
        if (d === 0.0) {
            return false;
        }
        const ix = x - this.x;
        const iy = y - this.y;
        out.x = (ix * this.d - iy * this.c) / d;
        out.y = (iy * this.a - ix * this.b) / d;
        return true;
    }

    inverse(): this {
        const detInv = 1 / this.determinant;
        const a = this.a * detInv;
        const b = this.b * detInv;
        const c = this.c * detInv;
        const d = this.d * detInv;
        const x = this.x;
        const y = this.y;

        this.a = d;
        this.b = -b;
        this.c = -c;
        this.d = a;
        this.x = y * c - x * d;
        this.y = x * b - y * a;

        return this;
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
}
