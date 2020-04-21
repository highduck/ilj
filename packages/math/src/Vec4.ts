export class Vec4 {

    static readonly ONE: Readonly<Vec4> = new Vec4(1, 1, 1, 1);
    static readonly ZERO: Readonly<Vec4> = new Vec4(0, 0, 0, 0);

    constructor(public x: number = 0,
                public y: number = 0,
                public z: number = 0,
                public w: number = 0) {

    }

    add(v: Readonly<Vec4>): this {
        this.x += v.x;
        this.y += v.y;
        this.z += v.z;
        this.w += v.w;
        return this;
    }

    addScale(v: Readonly<Vec4>, s: number): this {
        this.x += s * v.x;
        this.y += s * v.y;
        this.z += s * v.z;
        this.w += s * v.w;
        return this;
    }

    addMultiply(v: Readonly<Vec4>, m: Readonly<Vec4>): this {
        this.x += v.x * m.x;
        this.y += v.y * m.y;
        this.z += v.z * m.z;
        this.w += v.w * m.w;
        return this;
    }

    multiply(v: Readonly<Vec4>): this {
        this.x *= v.x;
        this.y *= v.y;
        this.z *= v.z;
        this.w *= v.w;
        return this;
    }

    multiplyValues(x: number, y: number, z: number, w: number): this {
        this.x *= x;
        this.y *= y;
        this.z *= z;
        this.w *= w;
        return this;
    }

    scale(s: number): this {
        this.x *= s;
        this.y *= s;
        this.z *= s;
        this.w *= s;
        return this;
    }

    copy(out?: Vec4): Vec4 {
        if (out === undefined) {
            return new Vec4(this.x, this.y, this.z, this.w);
        }
        return out.set(this.x, this.y, this.z, this.w);
    }

    copyFrom(v: Vec4): this {
        this.x = v.x;
        this.y = v.y;
        this.z = v.z;
        this.w = v.w;
        return this;
    }

    fill(v: number): this {
        this.x = v;
        this.y = v;
        this.z = v;
        this.w = v;
        return this;
    }

    set(x: number, y: number, z: number, w: number): this {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
        return this;
    }

    distance(to: Readonly<Vec4>): number {
        const dx = this.x - to.x;
        const dy = this.y - to.y;
        const dz = this.z - to.z;
        const dw = this.w - to.w;
        return Math.sqrt(dx * dx + dy * dy + dz * dz + dw * dw);
    }

    abs(): this {
        this.x = Math.abs(this.x);
        this.y = Math.abs(this.y);
        this.z = Math.abs(this.z);
        this.w = Math.abs(this.w);
        return this;
    }

    saturate(): this {
        this.x = this.x > 1 ? 1 : (this.x < 0 ? 0 : this.x);
        this.y = this.y > 1 ? 1 : (this.y < 0 ? 0 : this.y);
        this.z = this.z > 1 ? 1 : (this.z < 0 ? 0 : this.z);
        this.w = this.w > 1 ? 1 : (this.w < 0 ? 0 : this.w);
        return this;
    }

    setTuple(t: [number, number, number, number]): this {
        this.x = t[0];
        this.y = t[1];
        this.z = t[2];
        this.w = t[3];
        return this;
    }

    lerp(b: Vec4, t: number): this {
        const inv = 1 - t;
        this.x = inv * this.x + t * b.x;
        this.y = inv * this.y + t * b.y;
        this.z = inv * this.z + t * b.z;
        this.w = inv * this.w + t * b.w;
        return this;
    }

    lerpTuple(dest: [number, number, number, number], t: number): this {
        const inv = 1 - t;
        this.x = inv * this.x + t * dest[0];
        this.y = inv * this.y + t * dest[1];
        this.z = inv * this.z + t * dest[2];
        this.w = inv * this.w + t * dest[3];
        return this;
    }

    writeToArray(arr: number[], index: number) {
        arr[index++] = this.x;
        arr[index++] = this.y;
        arr[index++] = this.z;
        arr[index++] = this.w;
    }

    readFromArray(arr: number[], index: number) {
        this.x = arr[index++];
        this.y = arr[index++];
        this.z = arr[index++];
        this.w = arr[index++];
    }
}