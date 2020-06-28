import {MathUtil} from "./Math";

export class Vec3 {

    constructor(public x: number,
                public y: number,
                public z: number) {
    }

    // _serialize() {
    //     return {
    //         x: this.x,
    //         y: this.y,
    //         z: this.z
    //     };
    // }
    //
    // _deserialize(data) {
    //     const obj = Object.create(Vec3.prototype);
    //     obj.x = data.x;
    //     obj.y = data.y;
    //     obj.z = data.z;
    //     return obj;
    // }

    toString() {
        return JSON.stringify(this);
    }

    static zero(): Vec3 {
        return new Vec3(0, 0, 0);
    }

    static neo(x:number, y:number, z:number): Vec3 {
        return new Vec3(x, y, z);
    }

    static clone(v:Vec3) {
        PLANCK_ASSERT && Vec3.assert(v);
        return Vec3.neo(v.x, v.y, v.z);
    }

    static assert(o:any) {
        if (!PLANCK_ASSERT) return;
        if (!Vec3.isValid(o)) {
            PLANCK_DEBUG && console.debug(o);
            throw new Error('Invalid Vec3!');
        }
    }

    /**
     * Does this vector contain finite coordinates?
     */
    static isValid(v: Vec3): boolean {
        return v && MathUtil.isFinite(v.x) && MathUtil.isFinite(v.y) && MathUtil.isFinite(v.z);
    }

    setZero(): this {
        this.x = 0;
        this.y = 0;
        this.z = 0;
        return this;
    }

    set(x:number, y:number, z:number): this {
        this.x = x;
        this.y = y;
        this.z = z;
        return this;
    }

    copyFrom(v: Vec3) {
        this.x = v.x;
        this.y = v.y;
        this.z = v.z;
    }

    add(w:Vec3) {
        this.x += w.x;
        this.y += w.y;
        this.z += w.z;
        return this;
    }

    sub(w:Vec3):this {
        this.x -= w.x;
        this.y -= w.y;
        this.z -= w.z;
        return this;
    }

    mul(m:number):this {
        this.x *= m;
        this.y *= m;
        this.z *= m;
        return this;
    }

    static areEqual(v:Vec3, w:Vec3):boolean {
        PLANCK_ASSERT && Vec3.assert(v);
        PLANCK_ASSERT && Vec3.assert(w);
        return v === w || v.x === w.x && v.y === w.y && v.z === w.z;
    }

    /**
     * Perform the dot product on two vectors.
     */
    static dot(v:Vec3, w:Vec3):number {
        return v.x * w.x + v.y * w.y + v.z * w.z;
    }

    /**
     * Perform the cross product on two vectors. In 2D this produces a scalar.
     */
    static cross(v:Vec3, w:Vec3):Vec3 {
        return new Vec3(
            v.y * w.z - v.z * w.y,
            v.z * w.x - v.x * w.z,
            v.x * w.y - v.y * w.x
        );
    }

    static add(v: Vec3, w: Vec3): Vec3 {
        return new Vec3(v.x + w.x, v.y + w.y, v.z + w.z);
    }

    static sub(v: Vec3, w: Vec3): Vec3 {
        return new Vec3(v.x - w.x, v.y - w.y, v.z - w.z);
    }

    static mul(v: Vec3, m: number): Vec3 {
        return new Vec3(m * v.x, m * v.y, m * v.z);
    }

    neg(): this {
        this.x = -this.x;
        this.y = -this.y;
        this.z = -this.z;
        return this;
    }

    static neg(v: Vec3): Vec3 {
        return new Vec3(-v.x, -v.y, -v.z);
    }
}
