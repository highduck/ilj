import {Color32_ABGR, Color32_ARGB, color32_pack_floats} from "./Color32";

export class Color4 {
    get css(): string {
        return `rgba(${this.r * 255 | 0},${this.g * 255 | 0},${this.b * 255 | 0},${this.a})`;
    }

    get cssRGB(): string {
        return `rgb(${this.r * 255 | 0},${this.g * 255 | 0},${this.b * 255 | 0})`;
    }

    set argb32(color32: Color32_ARGB) {
        const inv = 1.0 / 255.0;
        this.a = (color32 >>> 24) * inv;
        this.r = ((color32 >>> 16) & 0xFF) * inv;
        this.g = ((color32 >>> 8) & 0xFF) * inv;
        this.b = (color32 & 0xFF) * inv;
    }

    get argb32(): Color32_ARGB {
        return color32_pack_floats(this.a, this.r, this.g, this.b);
    }

    get abgr32(): Color32_ABGR {
        return color32_pack_floats(this.a, this.b, this.g, this.r);
    }

    static readonly ONE: Readonly<Color4> = new Color4(1.0, 1.0, 1.0, 1.0);
    static readonly ZERO: Readonly<Color4> = new Color4(0.0, 0.0, 0.0, 0.0);
    static readonly BLACK: Readonly<Color4> = new Color4(0.0, 0.0, 0.0, 1.0);

    clone(): Color4 {
        return new Color4(this.r, this.g, this.b, this.a);
    }

    static color32(value: Color32_ARGB): Color4 {
        return new Color4(
            ((value >>> 16) & 0xFF) / 255.0,
            ((value >>> 8) & 0xFF) / 255.0,
            (value & 0xFF) / 255.0,
            (value >>> 24) / 255.0);
    }

    static color24(value: Color32_ARGB): Color4 {
        return new Color4(
            ((value >>> 16) & 0xFF) / 255.0,
            ((value >>> 8) & 0xFF) / 255.0,
            (value & 0xFF) / 255.0,
            1.0);
    }

    r = NaN;
    g = NaN;
    b = NaN;
    a = NaN;

    constructor(r = 0.0,
                g = 0.0,
                b = 0.0,
                a = 1.0) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    equals(v: Color4): boolean {
        const epsilon = 0.000001;
        return Math.abs(this.r - v.r) < epsilon &&
            Math.abs(this.g - v.g) < epsilon &&
            Math.abs(this.b - v.b) < epsilon &&
            Math.abs(this.a - v.a) < epsilon;
    }

    add(v: Readonly<Color4>): this {
        this.r += v.r;
        this.g += v.g;
        this.b += v.b;
        this.a += v.a;
        return this;
    }

    addScale(v: Readonly<Color4>, s: number): this {
        this.r += s * v.r;
        this.g += s * v.g;
        this.b += s * v.b;
        this.a += s * v.a;
        return this;
    }

    addMultiply(v: Readonly<Color4>, m: Readonly<Color4>): this {
        this.r += v.r * m.r;
        this.g += v.g * m.g;
        this.b += v.b * m.b;
        this.a += v.a * m.a;
        return this;
    }

    multiply(v: Readonly<Color4>): this {
        this.r *= v.r;
        this.g *= v.g;
        this.b *= v.b;
        this.a *= v.a;
        return this;
    }

    multiplyValues(r: number, g: number, b: number, a: number): this {
        this.r *= r;
        this.g *= g;
        this.b *= b;
        this.a *= a;
        return this;
    }

    scale(s: number): this {
        this.r *= s;
        this.g *= s;
        this.b *= s;
        this.a *= s;
        return this;
    }

    subtract(v: Readonly<Color4>): this {
        this.r -= v.r;
        this.g -= v.g;
        this.b -= v.b;
        this.a -= v.a;
        return this;
    }

    copy(out?: Color4): Color4 {
        if (out === undefined) {
            return new Color4(this.r, this.g, this.b, this.a);
        }
        return out.set(this.r, this.g, this.b, this.a);
    }

    copyFrom(v: Color4): this {
        this.r = v.r;
        this.g = v.g;
        this.b = v.b;
        this.a = v.a;
        return this;
    }

    fill(v: number): this {
        this.r = v;
        this.g = v;
        this.b = v;
        this.a = v;
        return this;
    }

    set(r: number, g: number, b: number, a: number): this {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
        return this;
    }

    distance(to: Readonly<Color4>): number {
        const dx = this.r - to.r;
        const dy = this.g - to.g;
        const dz = this.b - to.b;
        const dw = this.a - to.a;
        return Math.sqrt(dx * dx + dy * dy + dz * dz + dw * dw);
    }

    abs(): this {
        const abs = Math.abs;
        this.r = abs(this.r);
        this.g = abs(this.g);
        this.b = abs(this.b);
        this.a = abs(this.a);
        return this;
    }

    saturate(): this {
        this.r = this.r > 1.0 ? 1.0 : (this.r < 0.0 ? 0.0 : this.r);
        this.g = this.g > 1.0 ? 1.0 : (this.g < 0.0 ? 0.0 : this.g);
        this.b = this.b > 1.0 ? 1.0 : (this.b < 0.0 ? 0.0 : this.b);
        this.a = this.a > 1.0 ? 1.0 : (this.a < 0.0 ? 0.0 : this.a);
        return this;
    }

    setTuple(t: [number, number, number, number]): this {
        this.r = t[0];
        this.g = t[1];
        this.b = t[2];
        this.a = t[3];
        return this;
    }

    lerp(b: Color4, t: number): this {
        const inv = 1.0 - t;
        this.r = inv * this.r + t * b.r;
        this.g = inv * this.g + t * b.g;
        this.b = inv * this.b + t * b.b;
        this.a = inv * this.a + t * b.a;
        return this;
    }

    lerpTuple(dest: [number, number, number, number], t: number): this {
        const inv = 1.0 - t;
        this.r = inv * this.r + t * dest[0];
        this.g = inv * this.g + t * dest[1];
        this.b = inv * this.b + t * dest[2];
        this.a = inv * this.a + t * dest[3];
        return this;
    }

    writeToArray(arr: number[], index: number) {
        arr[index++] = this.r;
        arr[index++] = this.g;
        arr[index++] = this.b;
        arr[index++] = this.a;
    }

    readFromArray(arr: number[], index: number) {
        this.r = arr[index++];
        this.g = arr[index++];
        this.b = arr[index++];
        this.a = arr[index++];
    }

    static _lerp(out: Color4, a: Readonly<Color4>, b: Readonly<Color4>, t: number) {
        const inv = 1.0 - t;
        out.r = inv * a.r + t * b.r;
        out.g = inv * a.g + t * b.g;
        out.b = inv * a.b + t * b.b;
        out.a = inv * a.a + t * b.a;
    }

    static _combine(multiplier1: Readonly<Color4>, offset1: Readonly<Color4>,
                    multiplier2: Readonly<Color4>, offset2: Readonly<Color4>,
                    outMultiplier: Color4, outOffset: Color4) {
        outOffset.r = offset2.r * multiplier1.r + offset1.r;
        outOffset.g = offset2.g * multiplier1.g + offset1.g;
        outOffset.b = offset2.b * multiplier1.b + offset1.b;
        outOffset.a = offset1.a + offset2.a;
        outMultiplier.r = multiplier1.r * multiplier2.r;
        outMultiplier.g = multiplier1.g * multiplier2.g;
        outMultiplier.b = multiplier1.b * multiplier2.b;
        outMultiplier.a = multiplier1.a * multiplier2.a;
    }
}
