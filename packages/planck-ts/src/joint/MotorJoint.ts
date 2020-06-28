import {Joint, JointDef} from "../Joint";
import {Mat22} from "../common/Mat22";
import {Vec2} from "../common/Vec2";
import {MathUtil} from "../common/Math";
import {Rot} from "../common/Rot";
import {assert} from "../util/common";
import {TimeStep} from "../TimeStep";


/**
 * @typedef {Object} MotorJointDef
 *
 * Motor joint definition.
 *
 * @prop {float} angularOffset The bodyB angle minus bodyA angle in radians.
 * @prop {float} maxForce The maximum motor force in N.
 * @prop {float} maxTorque The maximum motor torque in N-m.
 * @prop {float} correctionFactor Position correction factor in the range [0,1].
 * @prop {Vec2} linearOffset Position of bodyB minus the position of bodyA, in
 *       bodyA's frame, in meters.
 */

export interface MotorJointDef extends JointDef {
    maxForce?: number;// 1.0,
    maxTorque?: number;//  : 1.0,
    correctionFactor?: number;//  0.3
    linearOffset?: Vec2;
}

/**
 * A motor joint is used to control the relative motion between two bodies. A
 * typical usage is to control the movement of a dynamic body with respect to
 * the ground.
 *
 * @param {MotorJointDef} def
 * @param {Body} bodyA
 * @param {Body} bodyB
 */
export class MotorJoint extends Joint {
    static readonly TYPE = 'motor-joint';

    m_linearOffset: Vec2;
    m_angularOffset: number;
    m_maxForce: number;
    m_maxTorque: number;
    m_correctionFactor: number;

    m_linearImpulse = Vec2.zero();
    m_angularImpulse = 0.0;

    // Solver temp
    m_rA = Vec2.zero();
    m_rB = Vec2.zero();
    m_localCenterA = Vec2.zero();
    m_localCenterB = Vec2.zero();
    m_linearError = Vec2.zero();
    m_angularError = 0;
    m_invMassA = 0;
    m_invMassB = 0;
    m_invIA = 0;
    m_invIB = 0;
    m_linearMass = Mat22.zero();
    m_angularMass = 0;

    constructor(def: MotorJointDef) {
        super(def, MotorJoint.TYPE);

        this.m_maxForce = def.maxForce ?? 1;
        this.m_maxTorque = def.maxTorque ?? 1;
        this.m_correctionFactor = def.correctionFactor ?? 0.3;
        this.m_linearOffset = def.linearOffset ? def.linearOffset : def.bodyA.getLocalPoint(def.bodyB.getPosition());

        const angleA = def.bodyA.getAngle();
        const angleB = def.bodyB.getAngle();
        this.m_angularOffset = angleB - angleA;

        // Point-to-point constraint
        // Cdot = v2 - v1
        // = v2 + cross(w2, r2) - v1 - cross(w1, r1)
        // J = [-I -r1_skew I r2_skew ]
        // Identity used:
        // w k % (rx i + ry j) = w * (-ry i + rx j)

        // Angle constraint
        // Cdot = w2 - w1
        // J = [0 0 -1 0 0 1]
        // K = invI1 + invI2
    }

    /**
     * Set the maximum friction force in N.
     */
    setMaxForce(force: number) {
        PLANCK_ASSERT && assert(MathUtil.isFinite(force) && force >= 0.0);
        this.m_maxForce = force;
    }

    /**
     * Get the maximum friction force in N.
     */
    getMaxForce() {
        return this.m_maxForce;
    }

    /**
     * Set the maximum friction torque in N*m.
     */
    setMaxTorque(torque: number) {
        PLANCK_ASSERT && assert(MathUtil.isFinite(torque) && torque >= 0.0);
        this.m_maxTorque = torque;
    }

    /**
     * Get the maximum friction torque in N*m.
     */
    getMaxTorque() {
        return this.m_maxTorque;
    }

    /**
     * Set the position correction factor in the range [0,1].
     */
    setCorrectionFactor(factor: number) {
        PLANCK_ASSERT && assert(MathUtil.isFinite(factor) && 0.0 <= factor && factor <= 1.0);
        this.m_correctionFactor = factor;
    }

    /**
     * Get the position correction factor in the range [0,1].
     */
    getCorrectionFactor() {
        return this.m_correctionFactor;
    }

    /**
     * Set/get the target linear offset, in frame A, in meters.
     */
    setLinearOffset(linearOffset: Vec2) {
        if (linearOffset.x !== this.m_linearOffset.x
            || linearOffset.y !== this.m_linearOffset.y) {
            this.m_bodyA.setAwake(true);
            this.m_bodyB.setAwake(true);
            this.m_linearOffset = linearOffset;
        }
    }

    getLinearOffset() {
        return this.m_linearOffset;
    }

    /**
     * Set/get the target angular offset, in radians.
     */
    setAngularOffset(angularOffset: number) {
        if (angularOffset !== this.m_angularOffset) {
            this.m_bodyA.setAwake(true);
            this.m_bodyB.setAwake(true);
            this.m_angularOffset = angularOffset;
        }
    }

    getAngularOffset() {
        return this.m_angularOffset;
    }

    getAnchorA() {
        return this.m_bodyA.getPosition();
    }

    getAnchorB() {
        return this.m_bodyB.getPosition();
    }

    getReactionForce(inv_dt: number) {
        return Vec2.mul(inv_dt, this.m_linearImpulse);
    }

    getReactionTorque(inv_dt: number) {
        return inv_dt * this.m_angularImpulse;
    }

    initVelocityConstraints(step: TimeStep) {
        this.m_localCenterA = this.m_bodyA.m_sweep.localCenter;
        this.m_localCenterB = this.m_bodyB.m_sweep.localCenter;
        this.m_invMassA = this.m_bodyA.m_invMass;
        this.m_invMassB = this.m_bodyB.m_invMass;
        this.m_invIA = this.m_bodyA.m_invI;
        this.m_invIB = this.m_bodyB.m_invI;

        const cA = this.m_bodyA.c_position.c;
        const aA = this.m_bodyA.c_position.a;
        const vA = this.m_bodyA.c_velocity.v;
        let wA = this.m_bodyA.c_velocity.w;

        const cB = this.m_bodyB.c_position.c;
        const aB = this.m_bodyB.c_position.a;
        const vB = this.m_bodyB.c_velocity.v;
        let wB = this.m_bodyB.c_velocity.w;

        const qA = Rot.forAngle(aA), qB = Rot.forAngle(aB);

        // Compute the effective mass matrix.
        this.m_rA = Rot.mulVec2(qA, Vec2.neg(this.m_localCenterA));
        this.m_rB = Rot.mulVec2(qB, Vec2.neg(this.m_localCenterB));

        // J = [-I -r1_skew I r2_skew]
        // [ 0 -1 0 1]
        // r_skew = [-ry; rx]

        // Matlab
        // K = [ mA+r1y^2*iA+mB+r2y^2*iB, -r1y*iA*r1x-r2y*iB*r2x, -r1y*iA-r2y*iB]
        // [ -r1y*iA*r1x-r2y*iB*r2x, mA+r1x^2*iA+mB+r2x^2*iB, r1x*iA+r2x*iB]
        // [ -r1y*iA-r2y*iB, r1x*iA+r2x*iB, iA+iB]

        const mA = this.m_invMassA;
        const mB = this.m_invMassB;
        const iA = this.m_invIA;
        const iB = this.m_invIB;

        const Kbc = -iA * this.m_rA.x * this.m_rA.y - iB * this.m_rB.x * this.m_rB.y;
        const K = new Mat22(
            mA + mB + iA * this.m_rA.y * this.m_rA.y + iB * this.m_rB.y * this.m_rB.y,
            Kbc, Kbc,
            mA + mB + iA * this.m_rA.x * this.m_rA.x + iB * this.m_rB.x * this.m_rB.x
        );

        this.m_linearMass = K.getInverse();

        this.m_angularMass = iA + iB;
        if (this.m_angularMass > 0.0) {
            this.m_angularMass = 1.0 / this.m_angularMass;
        }

        this.m_linearError = Vec2.zero();
        this.m_linearError.addCombine(1, cB, 1, this.m_rB);
        this.m_linearError.subCombine(1, cA, 1, this.m_rA);
        this.m_linearError.sub(Rot.mulVec2(qA, this.m_linearOffset));

        this.m_angularError = aB - aA - this.m_angularOffset;

        if (step.warmStarting) {
            // Scale impulses to support a variable time step.
            this.m_linearImpulse.mul(step.dtRatio);
            this.m_angularImpulse *= step.dtRatio;

            const P = new Vec2(this.m_linearImpulse.x, this.m_linearImpulse.y);

            vA.subMul(mA, P);
            wA -= iA * (Vec2.cross(this.m_rA, P) + this.m_angularImpulse);

            vB.addMul(mB, P);
            wB += iB * (Vec2.cross(this.m_rB, P) + this.m_angularImpulse);

        } else {
            this.m_linearImpulse.setZero();
            this.m_angularImpulse = 0.0;
        }

        // this.m_bodyA.c_velocity.v = vA;
        this.m_bodyA.c_velocity.w = wA;
        // this.m_bodyB.c_velocity.v = vB;
        this.m_bodyB.c_velocity.w = wB;
    }

    solveVelocityConstraints(step: TimeStep) {
        const vA = this.m_bodyA.c_velocity.v;
        let wA = this.m_bodyA.c_velocity.w;
        const vB = this.m_bodyB.c_velocity.v;
        let wB = this.m_bodyB.c_velocity.w;

        const mA = this.m_invMassA, mB = this.m_invMassB;
        const iA = this.m_invIA, iB = this.m_invIB;

        const h = step.dt;
        const inv_h = step.inv_dt;

        // Solve angular friction
        {
            const Cdot = wB - wA + inv_h * this.m_correctionFactor * this.m_angularError;
            let impulse = -this.m_angularMass * Cdot;

            const oldImpulse = this.m_angularImpulse;
            const maxImpulse = h * this.m_maxTorque;
            this.m_angularImpulse = MathUtil.clamp(this.m_angularImpulse + impulse,
                -maxImpulse, maxImpulse);
            impulse = this.m_angularImpulse - oldImpulse;

            wA -= iA * impulse;
            wB += iB * impulse;
        }

        // Solve linear friction
        {
            const Cdot = Vec2.zero();
            Cdot.addCombine(1, vB, 1, Vec2.crossSV(wB, this.m_rB));
            Cdot.subCombine(1, vA, 1, Vec2.crossSV(wA, this.m_rA));
            Cdot.addMul(inv_h * this.m_correctionFactor, this.m_linearError);

            let impulse = Vec2.neg(Mat22.mulVec2(this.m_linearMass, Cdot));
            const oldImpulse = Vec2.clone(this.m_linearImpulse);
            this.m_linearImpulse.add(impulse);

            var maxImpulse = h * this.m_maxForce;

            this.m_linearImpulse.clamp(maxImpulse);

            impulse = Vec2.sub(this.m_linearImpulse, oldImpulse);

            vA.subMul(mA, impulse);
            wA -= iA * Vec2.cross(this.m_rA, impulse);

            vB.addMul(mB, impulse);
            wB += iB * Vec2.cross(this.m_rB, impulse);
        }

        //this.m_bodyA.c_velocity.v.copyFrom(vA);
        this.m_bodyA.c_velocity.w = wA;
        //this.m_bodyB.c_velocity.v.copyFrom(vB);
        this.m_bodyB.c_velocity.w = wB;
    }

    solvePositionConstraints(step: TimeStep) {
        return true;
    }

}
