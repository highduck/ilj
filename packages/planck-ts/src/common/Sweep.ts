import {Vec2} from "./Vec2";
import {Transform} from "./Transform";
import {Rot} from "./Rot";
import {assert} from "../util/common";
import {MathUtil} from "./Math";

/**
 * This describes the motion of a body/shape for TOI computation. Shapes are
 * defined with respect to the body origin, which may not coincide with the
 * center of mass. However, to support dynamics we must interpolate the center
 * of mass position.
 *
 * @prop {Vec2} localCenter Local center of mass position
 * @prop {Vec2} c World center position
 * @prop {float} a World angle
 * @prop {float} alpha0 Fraction of the current time step in the range [0,1], c0
 *       and a0 are c and a at alpha0.
 */
export class Sweep {

    readonly localCenter = Vec2.zero();
    readonly c = Vec2.zero();
    a = 0.0;
    alpha0 = 0.0;
    readonly c0 = Vec2.zero();
    a0 = 0.0;

    setTransform(xf: Transform) {
        const c = Transform.mulVec2(xf, this.localCenter);
        this.c.copyFrom(c);
        this.c0.copyFrom(c);
        const angle = xf.q.getAngle();
        this.a = angle;
        this.a0 = angle;
    }

    setLocalCenter(localCenter: Vec2, xf: Transform) {
        this.localCenter.set(localCenter.x, localCenter.y);

        const c = Transform.mulVec2(xf, this.localCenter);
        this.c.copyFrom(c);
        this.c0.copyFrom(c);
    }

    /**
     * Get the interpolated transform at a specific time.
     *
     * @param xf
     * @param beta A factor in [0,1], where 0 indicates alpha0
     */
    getTransform(xf: Transform, beta: number) {
        xf.q.setAngle((1.0 - beta) * this.a0 + beta * this.a);
        xf.p.setCombine((1.0 - beta), this.c0, beta, this.c);

        // shift to origin
        xf.p.sub(Rot.mulVec2(xf.q, this.localCenter));
    }

    /**
     * Advance the sweep forward, yielding a new initial state.
     *
     * @param alpha The new initial time
     */
    advance(alpha: number) {
        PLANCK_ASSERT && assert(this.alpha0 < 1.0);
        const beta = (alpha - this.alpha0) / (1.0 - this.alpha0);
        this.c0.setCombine(beta, this.c, 1 - beta, this.c0);
        this.a0 = beta * this.a + (1 - beta) * this.a0;
        this.alpha0 = alpha;
    }

    forward() {
        this.a0 = this.a;
        this.c0.copyFrom(this.c);
    }

    /**
     * normalize the angles in radians to be between -pi and pi.
     */
    normalize() {
        const a0 = MathUtil.mod(this.a0, -Math.PI, +Math.PI);
        this.a -= this.a0 - a0;
        this.a0 = a0;
    }

    clone() {
        const clone = new Sweep();
        clone.localCenter.copyFrom(this.localCenter);
        clone.alpha0 = this.alpha0;
        clone.a0 = this.a0;
        clone.a = this.a;
        clone.c0.copyFrom(this.c0);
        clone.c.copyFrom(this.c);
        return clone;
    }

    // TODO: rename copyFrom
    set(that: Sweep) {
        this.localCenter.copyFrom(that.localCenter);
        this.alpha0 = that.alpha0;
        this.a0 = that.a0;
        this.a = that.a;
        this.c0.copyFrom(that.c0);
        this.c.copyFrom(that.c);
    }

}