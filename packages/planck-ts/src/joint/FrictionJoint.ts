import {Joint, JointDef} from "../Joint";
import {Vec2} from "../common/Vec2";
import {Mat22} from "../common/Mat22";
import {MathUtil} from "../common/Math";
import {Rot} from "../common/Rot";
import {assert} from "../util/common";
import {TimeStep} from "../TimeStep";

/**
 * @typedef {Object} FrictionJointDef
 *
 * Friction joint definition.
 *
 * @prop {float} maxForce The maximum friction force in N.
 * @prop {float} maxTorque The maximum friction torque in N-m.
 *
 * @prop {Vec2} localAnchorA The local anchor point relative to bodyA's origin.
 * @prop {Vec2} localAnchorB The local anchor point relative to bodyB's origin.
 */
export interface FrictionJointDef extends JointDef {
    localAnchorA?: Vec2;
    localAnchorB?: Vec2;
    anchor?: Vec2;
    maxForce?: number; // 0
    maxTorque?: number; // 0
}

export class FrictionJoint extends Joint {
    static readonly TYPE = 'friction-joint';

    m_localAnchorA: Vec2;
    m_localAnchorB: Vec2;

    // Solver shared
    m_linearImpulse = Vec2.zero();
    m_angularImpulse = 0.0;
    m_maxForce: number;
    m_maxTorque: number;

    // Solver temp
    m_rA = Vec2.zero();
    m_rB = Vec2.zero();
    m_localCenterA = Vec2.zero();
    m_localCenterB = Vec2.zero();
    m_invMassA = 0;
    m_invMassB = 0;
    m_invIA = 0;
    m_invIB = 0;
    m_linearMass = Mat22.zero();
    m_angularMass = 0;

    /**
     * Friction joint. This is used for top-down friction. It provides 2D
     * translational friction and angular friction.
     *
     * @param {FrictionJointDef} def
     * @param {Body} bodyA
     * @param {Body} bodyB
     * @param {Vec2} anchor Anchor in global coordination.
     */
    constructor(def: FrictionJointDef) {
        super(def, FrictionJoint.TYPE);
        this.m_type = FrictionJoint.TYPE;

        this.m_localAnchorA = def.anchor ? def.bodyA.getLocalPoint(def.anchor) : def.localAnchorA || Vec2.zero();
        this.m_localAnchorB = def.anchor ? def.bodyB.getLocalPoint(def.anchor) : def.localAnchorB || Vec2.zero();

        // Solver shared
        this.m_maxForce = def.maxForce ?? 0;
        this.m_maxTorque = def.maxTorque ?? 0;

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
     * The local anchor point relative to bodyA's origin.
     */
    getLocalAnchorA() {
        return this.m_localAnchorA;
    }

    /**
     * The local anchor point relative to bodyB's origin.
     */
    getLocalAnchorB() {
        return this.m_localAnchorB;
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

    getAnchorA() {
        return this.m_bodyA.getWorldPoint(this.m_localAnchorA);
    }

    getAnchorB() {
        return this.m_bodyB.getWorldPoint(this.m_localAnchorB);
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

        const aA = this.m_bodyA.c_position.a;
        const vA = this.m_bodyA.c_velocity.v;
        let wA = this.m_bodyA.c_velocity.w;

        const aB = this.m_bodyB.c_position.a;
        const vB = this.m_bodyB.c_velocity.v;
        let wB = this.m_bodyB.c_velocity.w;

        const qA = Rot.forAngle(aA), qB = Rot.forAngle(aB);

        // Compute the effective mass matrix.
        this.m_rA = Rot.mulVec2(qA, Vec2.sub(this.m_localAnchorA, this.m_localCenterA));
        this.m_rB = Rot.mulVec2(qB, Vec2.sub(this.m_localAnchorB, this.m_localCenterB));

        // J = [-I -r1_skew I r2_skew]
        // [ 0 -1 0 1]
        // r_skew = [-ry; rx]

        // Matlab
        // K = [ mA+r1y^2*iA+mB+r2y^2*iB, -r1y*iA*r1x-r2y*iB*r2x, -r1y*iA-r2y*iB]
        // [ -r1y*iA*r1x-r2y*iB*r2x, mA+r1x^2*iA+mB+r2x^2*iB, r1x*iA+r2x*iB]
        // [ -r1y*iA-r2y*iB, r1x*iA+r2x*iB, iA+iB]

        const mA = this.m_invMassA, mB = this.m_invMassB; // float
        const iA = this.m_invIA, iB = this.m_invIB; // float

        // TODO: reuse!
        const K_b_c = -iA * this.m_rA.x * this.m_rA.y - iB * this.m_rB.x * this.m_rB.y;
        const K = new Mat22(
            mA + mB + iA * this.m_rA.y * this.m_rA.y + iB * this.m_rB.y * this.m_rB.y,
            K_b_c, K_b_c,
            mA + mB + iA * this.m_rA.x * this.m_rA.x + iB * this.m_rB.x * this.m_rB.x
        );

        this.m_linearMass = K.getInverse();

        this.m_angularMass = iA + iB;
        if (this.m_angularMass > 0.0) {
            this.m_angularMass = 1.0 / this.m_angularMass;
        }

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

        // this.m_bodyA.c_velocity.v.copyFrom(vA);
        this.m_bodyA.c_velocity.w = wA;
        // this.m_bodyB.c_velocity.v.copyFrom(vB);
        this.m_bodyB.c_velocity.w = wB;
    }

    solveVelocityConstraints(step: TimeStep) {
        const vA = this.m_bodyA.c_velocity.v;
        let wA = this.m_bodyA.c_velocity.w;
        const vB = this.m_bodyB.c_velocity.v;
        let wB = this.m_bodyB.c_velocity.w;

        const mA = this.m_invMassA, mB = this.m_invMassB; // float
        const iA = this.m_invIA, iB = this.m_invIB; // float

        const h = step.dt; // float

        // Solve angular friction
        {
            var Cdot = wB - wA; // float
            var impulse = -this.m_angularMass * Cdot; // float

            var oldImpulse = this.m_angularImpulse; // float
            var maxImpulse = h * this.m_maxTorque; // float
            this.m_angularImpulse = MathUtil.clamp(this.m_angularImpulse + impulse,
                -maxImpulse, maxImpulse);
            impulse = this.m_angularImpulse - oldImpulse;

            wA -= iA * impulse;
            wB += iB * impulse;
        }

        // Solve linear friction
        {
            const Cdot = Vec2.sub(Vec2.add(vB, Vec2.crossSV(wB, this.m_rB)), Vec2.add(vA,
                Vec2.crossSV(wA, this.m_rA))); // Vec2

            let impulse = Vec2.neg(Mat22.mulVec2(this.m_linearMass, Cdot)); // Vec2
            const oldImpulse = this.m_linearImpulse; // Vec2
            this.m_linearImpulse.add(impulse);

            const maxImpulse = h * this.m_maxForce; // float

            if (this.m_linearImpulse.lengthSquared() > maxImpulse * maxImpulse) {
                this.m_linearImpulse.normalize();
                this.m_linearImpulse.mul(maxImpulse);
            }

            impulse = Vec2.sub(this.m_linearImpulse, oldImpulse);

            vA.subMul(mA, impulse);
            wA -= iA * Vec2.cross(this.m_rA, impulse);

            vB.addMul(mB, impulse);
            wB += iB * Vec2.cross(this.m_rB, impulse);
        }

        // this.m_bodyA.c_velocity.v.copyFrom(vA);
        this.m_bodyA.c_velocity.w = wA;
        // this.m_bodyB.c_velocity.v.copyFrom(vB);
        this.m_bodyB.c_velocity.w = wB;
    }

    solvePositionConstraints(step: TimeStep) {
        return true;
    }

}
