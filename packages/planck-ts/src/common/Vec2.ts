import {MathUtil} from "./Math";

export class Vec2 {

    static readonly ZERO = new Vec2(0, 0);
    static readonly ONE = new Vec2(1, 1);
    static readonly UNIT_X = new Vec2(1, 0);
    static readonly UNIT_Y = new Vec2(0, 1);

    constructor(public x: number,
                public y: number) {
    }

    static zero(): Vec2 {
        // todo: could be static readonly ref
        return new Vec2(0, 0);
    }

    static clone(v: Vec2): Vec2 {
        return new Vec2(v.x, v.y);
    }

    toString() {
        return JSON.stringify(this);
    }

    /**
     * Does this vector contain finite coordinates?
     */
    static isValid(v: any) {
        return v != null && MathUtil.isFinite(v.x) && MathUtil.isFinite(v.y);
    }

    static assert(o: any) {
        if (!PLANCK_ASSERT) return;
        if (!Vec2.isValid(o)) {
            PLANCK_DEBUG && console.debug(o);
            throw new Error('Invalid Vec2!');
        }
    }

    clone(): Vec2 {
        return new Vec2(this.x, this.y);
    }

    /**
     * Set this vector to all zeros.
     *
     * @returns this
     */
    setZero(): this {
        this.x = 0.0;
        this.y = 0.0;
        return this;
    }

    /**
     * Set this vector to some specified coordinates.
     *
     * @returns this
     */
    set(x: number, y: number) {
        PLANCK_ASSERT && MathUtil.assert(x);
        PLANCK_ASSERT && MathUtil.assert(y);
        this.x = x;
        this.y = y;
        return this;
    }

    copyFrom(v: Vec2): this {
        this.x = v.x;
        this.y = v.y;
        return this;
    }

    /**
     * Set linear combination of v and w: `a * v + b * w`
     */
    setCombine(a: number, v: Vec2, b: number, w: Vec2): this {
        PLANCK_ASSERT && MathUtil.assert(a);
        PLANCK_ASSERT && Vec2.assert(v);
        PLANCK_ASSERT && MathUtil.assert(b);
        PLANCK_ASSERT && Vec2.assert(w);
        const x = a * v.x + b * w.x;
        const y = a * v.y + b * w.y;

        // `this` may be `w`
        this.x = x;
        this.y = y;
        return this;
    }

    setMul(a: number, v: Vec2): this {
        PLANCK_ASSERT && MathUtil.assert(a);
        PLANCK_ASSERT && Vec2.assert(v);
        const x = a * v.x;
        const y = a * v.y;

        this.x = x;
        this.y = y;
        return this;
    }

    /**
     * Add a vector to this vector.
     *
     * @returns this
     */
    add(w: Vec2): this {
        PLANCK_ASSERT && Vec2.assert(w);
        this.x += w.x;
        this.y += w.y;
        return this;
    }

    /**
     * Add linear combination of v and w: `a * v + b * w`
     */
    addCombine(a: number, v: Vec2, b: number, w: Vec2): this {
        PLANCK_ASSERT && MathUtil.assert(a);
        PLANCK_ASSERT && Vec2.assert(v);
        PLANCK_ASSERT && MathUtil.assert(b);
        PLANCK_ASSERT && Vec2.assert(w);

        const x = a * v.x + b * w.x;
        const y = a * v.y + b * w.y;

        // `this` may be `w`
        this.x += x;
        this.y += y;
        return this;
    }

    addMul(a: number, v: Vec2): this {
        PLANCK_ASSERT && MathUtil.assert(a);
        PLANCK_ASSERT && Vec2.assert(v);
        const x = a * v.x;
        const y = a * v.y;

        this.x += x;
        this.y += y;
        return this;
    }

    /**
     * Subtract linear combination of v and w: `a * v + b * w`
     */
    subCombine(a: number, v: Vec2, b: number, w: Vec2): this {
        PLANCK_ASSERT && MathUtil.assert(a);
        PLANCK_ASSERT && Vec2.assert(v);
        PLANCK_ASSERT && MathUtil.assert(b);
        PLANCK_ASSERT && Vec2.assert(w);

        const x = a * v.x + b * w.x;
        const y = a * v.y + b * w.y;

        // `this` may be `w`
        this.x -= x;
        this.y -= y;
        return this;
    }

    subMul(a: number, v: Vec2): this {
        PLANCK_ASSERT && MathUtil.assert(a);
        PLANCK_ASSERT && Vec2.assert(v);
        const x = a * v.x;
        const y = a * v.y;

        this.x -= x;
        this.y -= y;
        return this;
    }

    /**
     * Subtract a vector from this vector
     *
     * @returns this
     */
    sub(w: Vec2): this {
        PLANCK_ASSERT && Vec2.assert(w);
        this.x -= w.x;
        this.y -= w.y;
        return this;
    }

    /**
     * Multiply this vector by a scalar.
     *
     * @returns this
     */
    mul(m: number): this {
        PLANCK_ASSERT && MathUtil.assert(m);
        this.x *= m;
        this.y *= m;
        return this;
    }

    /**
     * Get the length of this vector (the norm).
     *
     * For performance, use this instead of lengthSquared (if possible).
     */
    length(): number {
        return Vec2.lengthOf(this);
    }

    /**
     * Get the length squared.
     */
    lengthSquared(): number {
        return Vec2.lengthSquared(this);
    }

    /**
     * Convert this vector into a unit vector.
     *
     * @returns old length
     */
    normalize(): number {
        const length = this.length();
        if (length < MathUtil.EPSILON) {
            return 0.0;
        }
        const invLength = 1.0 / length;
        this.x *= invLength;
        this.y *= invLength;
        return length;
    }

    /**
     * Get the length of this vector (the norm).
     *
     * For performance, use this instead of lengthSquared (if possible).
     */
    static lengthOf(v: Vec2): number {
        PLANCK_ASSERT && Vec2.assert(v);
        return Math.sqrt(v.x * v.x + v.y * v.y);
    }

    /**
     * Get the length squared.
     */
    static lengthSquared(v: Vec2): number {
        PLANCK_ASSERT && Vec2.assert(v);
        return v.x * v.x + v.y * v.y;
    }

    static distance(v: Vec2, w: Vec2): number {
        PLANCK_ASSERT && Vec2.assert(v);
        PLANCK_ASSERT && Vec2.assert(w);
        const dx = v.x - w.x;
        const dy = v.y - w.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    static distanceSquared(v: Vec2, w: Vec2): number {
        PLANCK_ASSERT && Vec2.assert(v);
        PLANCK_ASSERT && Vec2.assert(w);
        const dx = v.x - w.x;
        const dy = v.y - w.y;
        return dx * dx + dy * dy;
    }

    static areEqual(v: Vec2, w: Vec2): boolean {
        PLANCK_ASSERT && Vec2.assert(v);
        PLANCK_ASSERT && Vec2.assert(w);
        return v === w || typeof w === 'object' && w !== null && v.x === w.x && v.y === w.y;
    }

    /**
     * Get the skew vector such that dot(skew_vec, other) == cross(vec, other)
     */
    static skew(v: Vec2): Vec2 {
        PLANCK_ASSERT && Vec2.assert(v);
        return new Vec2(-v.y, v.x);
    }

    /**
     * Perform the dot product on two vectors.
     */
    static dot(v: Vec2, w: Vec2): number {
        PLANCK_ASSERT && Vec2.assert(v);
        PLANCK_ASSERT && Vec2.assert(w);
        return v.x * w.x + v.y * w.y;
    }

    /**
     * Perform the cross product on two vectors. In 2D this produces a scalar.
     *
     * Perform the cross product on a vector and a scalar. In 2D this produces a
     * vector.
     */
    static cross(v: Vec2, w: Vec2): number {
        PLANCK_ASSERT && Vec2.assert(v);
        PLANCK_ASSERT && Vec2.assert(w);
        return v.x * w.y - v.y * w.x
    }

    static crossVS(v: Vec2, w: number): Vec2 {
        PLANCK_ASSERT && Vec2.assert(v);
        PLANCK_ASSERT && MathUtil.assert(w);
        return new Vec2(w * v.y, -w * v.x);
    }

    static crossSV(v: number, w: Vec2): Vec2 {
        PLANCK_ASSERT && MathUtil.assert(v);
        PLANCK_ASSERT && Vec2.assert(w);
        return new Vec2(-v * w.y, v * w.x);
    }

    /**
     * Returns `a + (v x w)`
     */
    static addCrossSV(a: Vec2, v: number, w: Vec2): Vec2 {
        PLANCK_ASSERT && MathUtil.assert(v);
        PLANCK_ASSERT && Vec2.assert(w);
        return new Vec2(-v * w.y + a.x, v * w.x + a.y);
    }

    static addCrossVS(a: Vec2, v: Vec2, w: number): Vec2 {
        PLANCK_ASSERT && Vec2.assert(v);
        PLANCK_ASSERT && MathUtil.assert(w);
        return new Vec2(w * v.y + a.x, -w * v.x + a.y);
    }

    static add(v: Vec2, w: Vec2): Vec2 {
        PLANCK_ASSERT && Vec2.assert(v);
        PLANCK_ASSERT && Vec2.assert(w);
        return new Vec2(v.x + w.x, v.y + w.y);
    }

    static combine(a: number, v: Vec2, b: number, w: Vec2) {
        return Vec2.zero().setCombine(a, v, b, w);
    }

    static sub(v: Vec2, w: Vec2): Vec2 {
        PLANCK_ASSERT && Vec2.assert(v);
        PLANCK_ASSERT && Vec2.assert(w);
        return new Vec2(v.x - w.x, v.y - w.y);
    }

    static mul(a: number, b: Vec2): Vec2 {
        PLANCK_ASSERT && MathUtil.assert(a);
        PLANCK_ASSERT && Vec2.assert(b);
        return new Vec2(a * b.x, a * b.y);
    }

    neg(): this {
        this.x = -this.x;
        this.y = -this.y;
        return this;
    }

    static neg(v: Vec2): Vec2 {
        PLANCK_ASSERT && Vec2.assert(v);
        return new Vec2(-v.x, -v.y);
    }

    static abs(v: Vec2): Vec2 {
        PLANCK_ASSERT && Vec2.assert(v);
        return new Vec2(Math.abs(v.x), Math.abs(v.y));
    }

    static mid(v: Vec2, w: Vec2): Vec2 {
        PLANCK_ASSERT && Vec2.assert(v);
        PLANCK_ASSERT && Vec2.assert(w);
        return new Vec2(0.5 * (v.x + w.x), 0.5 * (v.y + w.y));
    }

    static upper(v: Vec2, w: Vec2): Vec2 {
        PLANCK_ASSERT && Vec2.assert(v);
        PLANCK_ASSERT && Vec2.assert(w);
        return new Vec2(Math.max(v.x, w.x), Math.max(v.y, w.y));
    }

    static lower(v: Vec2, w: Vec2): Vec2 {
        PLANCK_ASSERT && Vec2.assert(v);
        PLANCK_ASSERT && Vec2.assert(w);
        return new Vec2(Math.min(v.x, w.x), Math.min(v.y, w.y));
    }

    clamp(max: number): this {
        const lengthSqr = this.x * this.x + this.y * this.y;
        if (lengthSqr > max * max) {
            const invLength = MathUtil.invSqrt(lengthSqr);
            this.x *= invLength * max;
            this.y *= invLength * max;
        }
        return this;
    }

    static clamp(v: Vec2, max: number): Vec2 {
        v = new Vec2(v.x, v.y);
        v.clamp(max);
        return v;
    }
}