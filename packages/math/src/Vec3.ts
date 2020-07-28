export class Vec3 {

    static readonly ONE: Readonly<Vec3> = new Vec3(1, 1, 1);
    static readonly ZERO: Readonly<Vec3> = new Vec3(0, 0, 0);

    x = NaN;
    y = NaN;
    z = NaN;

    constructor(x = 0,
                y = 0,
                z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    add(v: Readonly<Vec3>): this {
        this.x += v.x;
        this.y += v.y;
        this.z += v.z;
        return this;
    }

    addScale(v: Readonly<Vec3>, s: number): this {
        this.x += s * v.x;
        this.y += s * v.y;
        this.z += s * v.z;
        return this;
    }

    addMultiply(v: Readonly<Vec3>, m: Readonly<Vec3>): this {
        this.x += v.x * m.x;
        this.y += v.y * m.y;
        this.z += v.z * m.z;
        return this;
    }

    multiply(v: Readonly<Vec3>): this {
        this.x *= v.x;
        this.y *= v.y;
        this.z *= v.z;
        return this;
    }

    scale(s: number): this {
        this.x *= s;
        this.y *= s;
        this.z *= s;
        return this;
    }

    copy(out?: Vec3): Vec3 {
        if (out === undefined) {
            return new Vec3(this.x, this.y, this.z);
        }
        return out.set(this.x, this.y, this.z);
    }

    copyFrom(v: Vec3): this {
        this.x = v.x;
        this.y = v.y;
        this.z = v.z;
        return this;
    }

    fill(v: number): this {
        this.x = v;
        this.y = v;
        this.z = v;
        return this;
    }

    set(x: number, y: number, z: number): this {
        this.x = x;
        this.y = y;
        this.z = z;
        return this;
    }

    distance(to: Readonly<Vec3>): number {
        const dx = this.x - to.x;
        const dy = this.y - to.y;
        const dz = this.z - to.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    abs(): this {
        this.x = Math.abs(this.x);
        this.y = Math.abs(this.y);
        this.z = Math.abs(this.z);
        return this;
    }

    setTuple(t: [number, number, number]): this {
        this.x = t[0];
        this.y = t[1];
        this.z = t[2];
        return this;
    }
}
