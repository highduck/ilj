import {Matrix2D} from "./Matrix2D";

export class Vec2 {

    get length(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    get lengthSqr(): number {
        return this.x * this.x + this.y * this.y;
    }

    static readonly ONE: Readonly<Vec2> = new Vec2(1, 1);
    static readonly ZERO: Readonly<Vec2> = new Vec2(0, 0);

    // static direction(angle: number, out?: Vec2): Vec2 {
    //     return (out ?? new Vec2()).set(Math.cos(angle), Math.sin(angle));
    // }

    constructor(public x: number = 0, public y: number = 0) {

    }

    add(v: Readonly<Vec2>): this {
        this.x += v.x;
        this.y += v.y;
        return this;
    }

    addScale(v: Readonly<Vec2>, s: number): this {
        this.x += s * v.x;
        this.y += s * v.y;
        return this;
    }

    addMultiply(v: Readonly<Vec2>, m: Readonly<Vec2>): this {
        this.x += v.x * m.x;
        this.y += v.y * m.y;
        return this;
    }

    multiply(v: Readonly<Vec2>): this {
        this.x *= v.x;
        this.y *= v.y;
        return this;
    }

    scale(s: number): this {
        this.x *= s;
        this.y *= s;
        return this;
    }

    copy(out?: Vec2): Vec2 {
        if (out === undefined) {
            return new Vec2(this.x, this.y);
        }
        return out.set(this.x, this.y);
    }

    copyFrom(v: Vec2): this {
        this.x = v.x;
        this.y = v.y;
        return this;
    }

    fill(v: number): this {
        this.x = v;
        this.y = v;
        return this;
    }

    set(x: number, y: number): this {
        this.x = x;
        this.y = y;
        return this;
    }

    rotate_unit(cs_sn: Readonly<Vec2>): this {
        const x = this.x;
        const y = this.y;
        this.x = cs_sn.x * x - cs_sn.y * y;
        this.y = cs_sn.y * x + cs_sn.x * y;
        return this;
    }

    rotate(angle: number) {
        const x = this.x;
        const y = this.y;
        const cs = Math.cos(angle);
        const sn = Math.sin(angle);
        this.x = cs * x - sn * y;
        this.y = sn * x + cs * y;
        return this;
    }

    distance(to: Readonly<Vec2>): number {
        return Math.sqrt(this.distanceSqr(to));
    }

    abs(): this {
        this.x = Math.abs(this.x);
        this.y = Math.abs(this.y);
        return this;
    }

    setTuple(t: [number, number]): this {
        this.x = t[0];
        this.y = t[1];
        return this;
    }

    subtract(v: Vec2): this {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }

    negate(): this {
        this.x = -this.x;
        this.y = -this.y;
        return this;
    }

    distanceSqr(to: Readonly<Vec2>): number {
        const dx = this.x - to.x;
        const dy = this.y - to.y;
        return dx * dx + dy * dy;
    }

    transform(matrix: Matrix2D): this {
        const x = this.x;
        const y = this.y;
        this.x = x * matrix.a + y * matrix.c + matrix.x;
        this.y = x * matrix.b + y * matrix.d + matrix.y;
        return this;
    }

    normalize(): this {
        const len = this.length;
        if (len > 0.0) {
            const scale = 1.0 / len;
            this.x *= scale;
            this.y *= scale;
        }
        return this;
    }

    normalizeScale(scale: number): this {
        const len = this.length;
        if (len > 0.0) {
            scale /= len;
            this.x *= scale;
            this.y *= scale;
        }
        return this;
    }

    lerp(end: Vec2, t: number): this {
        const inv = 1 - t;
        this.x = inv * this.x + t * end.x;
        this.y = inv * this.y + t * end.y;
        return this;
    }

    perpendicular(): this {
        const tmp = this.x;
        this.x = -this.y;
        this.y = tmp;
        return this;
    }

    direction(angle: number, length: number = 1): this {
        this.x = Math.cos(angle) * length;
        this.y = Math.sin(angle) * length;
        return this;
    }
}
