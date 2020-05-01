import {Color32_ABGR, Color32_ARGB, color32_pack_floats} from "./Color32";
import {lerp, saturate} from "./scalar";

const packFloats = color32_pack_floats;

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
        return packFloats(this.a, this.r, this.g, this.b);
    }

    get abgr32(): Color32_ABGR {
        return packFloats(this.a, this.b, this.g, this.r);
    }

    static readonly ONE: Readonly<Color4> = new Color4(1, 1, 1, 1);
    static readonly ZERO: Readonly<Color4> = new Color4(0, 0, 0, 0);

    static color32(value: Color32_ARGB): Color4 {
        return new Color4(
            ((value >>> 16) & 0xFF) / 255.0,
            ((value >>> 8) & 0xFF) / 255.0,
            (value & 0xFF) / 255.0,
            (value >>> 24) / 255.0);
    }

    constructor(public r: number = 0,
                public g: number = 0,
                public b: number = 0,
                public a: number = 1) {

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
        this.r = this.r > 1 ? 1 : (this.r < 0 ? 0 : this.r);
        this.g = this.g > 1 ? 1 : (this.g < 0 ? 0 : this.g);
        this.b = this.b > 1 ? 1 : (this.b < 0 ? 0 : this.b);
        this.a = this.a > 1 ? 1 : (this.a < 0 ? 0 : this.a);
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
        const inv = 1 - t;
        this.r = inv * this.r + t * b.r;
        this.g = inv * this.g + t * b.g;
        this.b = inv * this.b + t * b.b;
        this.a = inv * this.a + t * b.a;
        return this;
    }

    lerpTuple(dest: [number, number, number, number], t: number): this {
        const inv = 1 - t;
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
}

// HVSColor - [hue, value, saturation, alpha]

// 7
const HUE_TABLE: Color4[] = [
    new Color4(1, 0, 0, 1),
    new Color4(1, 1, 0, 1),
    new Color4(0, 1, 0, 1),
    new Color4(0, 1, 1, 1),
    new Color4(0, 0, 1, 1),
    new Color4(1, 0, 1, 1),
    new Color4(1, 0, 0, 1),
];

function rgbHue(max: number, delta: number, r: number, g: number, b: number): number {
    let hue = 0;
    if (r >= max) {
        hue = (g - b) / delta;
    } else if (g >= max) {
        hue = 2.0 + (b - r) / delta;
    } else {
        hue = 4.0 + (r - g) / delta;
    }

    hue /= HUE_TABLE.length - 1;
    if (hue < 0.0) {
        hue += 1.0;
    }

    return hue;
}

function lerpChannel(value: number, x: number, y: number) {
    return lerp(0, lerp(1, value, x), y);
}

export function setRGBForHue(rgba: Color4, hueNormalized: number): Color4 {
    const t = saturate(hueNormalized) * (HUE_TABLE.length - 1);
    const i = t | 0;

    // return lerp(HUE_TABLE[i], HUE_TABLE[i + 1], t - i);
    rgba.copyFrom(HUE_TABLE[i]).lerp(HUE_TABLE[i + 1], t - i);
    return rgba;
}

export function toRGB(hvs: Color4): Color4 {
    const hue = hvs.r;
    const value = hvs.g;
    const saturation = hvs.b;

    setRGBForHue(hvs, hue);
    hvs.r = lerpChannel(hvs.r, saturation, value);
    hvs.g = lerpChannel(hvs.g, saturation, value);
    hvs.b = lerpChannel(hvs.b, saturation, value);
    return hvs;
}

export function toHVS(rgb: Color4): Color4 {
    const r = rgb.r;
    const g = rgb.g;
    const b = rgb.b;
    const min = Math.min(r, g, b);
    const max = Math.max(r, g, b);
    const delta = max - min;
    // value:
    rgb.g = max / 255.0;

    if (max > 0.0 && delta > 0.0) {
        // saturation
        rgb.b = delta / max;
        // hue:
        rgb.r = rgbHue(max, delta, r, g, b);
    } else {
        // saturation
        rgb.b = 0.0;
        // hue:
        rgb.r = -1.0;
    }
    return rgb;
}
