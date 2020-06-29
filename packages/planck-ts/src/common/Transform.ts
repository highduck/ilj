import {Vec2} from "./Vec2";
import {Rot} from "./Rot";

// TODO merge with Rot
export class Transform {
    /**
     * A transform contains translation and rotation. It is used to represent the
     * position and orientation of rigid frames. Initialize using a position vector
     * and a rotation.
     *
     * @prop {Vec2} position [zero]
     * @prop {Rot} rotation [identity]
     */
    constructor(public p: Vec2,
                public q: Rot) {
    }

    static clone(xf: Transform): Transform {
        return new Transform(xf.p.clone(), xf.q.clone());
    }

    static identity(): Transform {
        return new Transform(new Vec2(0, 0), Rot.identity());
    }

    /**
     * Set this to the identity transform.
     */
    setIdentity() {
        this.p.x = 0;
        this.p.y = 0;
        this.q.s = 0;
        this.q.c = 1;
    }

    /**
     * Set this based on the position and angle.
     */
    set(a: Vec2, b: Rot) {
        this.p.copyFrom(a);
        this.q.set(b);
    }

    setPosAngle(pos: Vec2, angle: number) {
        this.p.copyFrom(pos);
        this.q.setAngle(angle);
    }

    copyFrom(xf: Transform) {
        this.p.copyFrom(xf.p);
        this.q.set(xf.q);
    }

    static isValid(o: any) {
        return o && Vec2.isValid(o.p) && Rot.isValid(o.q);
    }

    static assert(o: any) {
        if (!PLANCK_ASSERT) return;
        if (!Transform.isValid(o)) {
            PLANCK_DEBUG && console.debug(o);
            throw new Error('Invalid Transform!');
        }
    }

    /**
     * @param {Transform} a
     * @param {Vec2} b
     * @returns {Vec2}
     *
     * @param {Transform} a
     * @param {Transform} b
     * @returns {Transform}
     */
    // static mul(a, b) {
    //     PLANCK_ASSERT && Transform.assert(a);
    //     if (Array.isArray(b)) {
    //         var arr = [];
    //         for (var i = 0; i < b.length; i++) {
    //             arr[i] = Transform.mul(a, b[i]);
    //         }
    //         return arr;
    //
    //     } else if ('x' in b && 'y' in b) {
    //         PLANCK_ASSERT && Vec2.assert(b);
    //         var x = (a.q.c * b.x - a.q.s * b.y) + a.p.x;
    //         var y = (a.q.s * b.x + a.q.c * b.y) + a.p.y;
    //         return Vec2.neo(x, y);
    //
    //     } else if ('p' in b && 'q' in b) {
    //         PLANCK_ASSERT && Transform.assert(b);
    //         // v2 = A.q.Rot(B.q.Rot(v1) + B.p) + A.p
    //         // = (A.q * B.q).Rot(v1) + A.q.Rot(B.p) + A.p
    //         var xf = Transform.identity();
    //         xf.q = Rot.mulRot(a.q, b.q);
    //         xf.p = Vec2.add(Rot.mulVec2(a.q, b.p), a.p);
    //         return xf;
    //     }
    // }

    /**
     * @deprecated Use mulFn instead.
     */
    // static mulAll(a, b) {
    //     PLANCK_ASSERT && Transform.assert(a);
    //     var arr = [];
    //     for (var i = 0; i < b.length; i++) {
    //         arr[i] = Transform.mul(a, b[i]);
    //     }
    //     return arr;
    // }

    /**
     * @experimental
     */
    // static mulFn(a) {
    //     PLANCK_ASSERT && Transform.assert(a);
    //     return function (b) {
    //         return Transform.mul(a, b);
    //     };
    // }

    static mulVec2(a: Transform, b: Vec2): Vec2 {
        PLANCK_ASSERT && Transform.assert(a);
        PLANCK_ASSERT && Vec2.assert(b);
        const x = (a.q.c * b.x - a.q.s * b.y) + a.p.x;
        const y = (a.q.s * b.x + a.q.c * b.y) + a.p.y;
        return new Vec2(x, y);
    }

    static _mulVec2(a: Transform, b: Vec2, out: Vec2) {
        const x = b.x;
        const y = b.y;
        out.x = (a.q.c * x - a.q.s * y) + a.p.x;
        out.y = (a.q.s * x + a.q.c * y) + a.p.y;
    }

    static mulXf(a: Transform, b: Transform): Transform {
        PLANCK_ASSERT && Transform.assert(a);
        PLANCK_ASSERT && Transform.assert(b);
        // v2 = A.q.Rot(B.q.Rot(v1) + B.p) + A.p
        // = (A.q * B.q).Rot(v1) + A.q.Rot(B.p) + A.p
        const xf = Transform.identity();
        xf.q = Rot.mulRot(a.q, b.q);
        xf.p = Vec2.add(Rot.mulVec2(a.q, b.p), a.p);
        return xf;
    }

    /**
     * @param {Transform} a
     * @param {Vec2} b
     * @returns {Vec2}
     */
    static mulTVec2(a: Transform, b: Vec2): Vec2 {
        PLANCK_ASSERT && Transform.assert(a);
        PLANCK_ASSERT && Vec2.assert(b)
        const px = b.x - a.p.x;
        const py = b.y - a.p.y;
        const x = (a.q.c * px + a.q.s * py);
        const y = (-a.q.s * px + a.q.c * py);
        return new Vec2(x, y);
    }

    static _mulTVec2(a: Transform, b: Vec2, out: Vec2) {
        const px = b.x - a.p.x;
        const py = b.y - a.p.y;
        out.x = a.q.c * px + a.q.s * py;
        out.y = -a.q.s * px + a.q.c * py;
    }

    /**
     * @param {Transform} a
     * @param {Transform} b
     * @returns {Transform}
     */
    static mulTXf(a: Transform, b: Transform): Transform {
        PLANCK_ASSERT && Transform.assert(a);
        PLANCK_ASSERT && Transform.assert(b);
        // v2 = A.q' * (B.q * v1 + B.p - A.p)
        // = A.q' * B.q * v1 + A.q' * (B.p - A.p)
        const xf = Transform.identity();
        xf.q.set(Rot.mulTRot(a.q, b.q));
        const v = Rot.mulTVec2(a.q, Vec2.sub(b.p, a.p));
        xf.p.set(v.x, v.y);
        return xf;
    }

}